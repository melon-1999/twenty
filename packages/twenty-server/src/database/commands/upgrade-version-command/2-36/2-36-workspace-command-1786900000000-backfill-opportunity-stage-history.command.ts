import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const OPPORTUNITY = STANDARD_OBJECTS.opportunity;

const STAGE_HISTORY_FIELD_UNIVERSAL_IDENTIFIER =
  OPPORTUNITY.fields.stageHistory.universalIdentifier;

@RegisteredWorkspaceCommand('2.36.0', 1786900000000)
@Command({
  name: 'upgrade:2-36:backfill-opportunity-stage-history',
  description:
    'Add the Opportunity stageHistory field and seed it on existing rows',
})
export class BackfillOpportunityStageHistoryCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    const { flatFieldMetadataMaps, flatObjectMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
        'flatObjectMetadataMaps',
      ]);

    const opportunityObjectMetadata =
      findFlatEntityByUniversalIdentifier<FlatObjectMetadata>({
        flatEntityMaps: flatObjectMetadataMaps,
        universalIdentifier: OPPORTUNITY.universalIdentifier,
      });

    if (!isDefined(opportunityObjectMetadata)) {
      this.logger.log(
        `Opportunity object does not exist for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    const stageHistoryFieldAlreadyExists = isDefined(
      flatFieldMetadataMaps.byUniversalIdentifier[
        STAGE_HISTORY_FIELD_UNIVERSAL_IDENTIFIER
      ],
    );

    if (!stageHistoryFieldAlreadyExists) {
      if (isDryRun) {
        this.logger.log(
          `[DRY RUN] Would create Opportunity stageHistory field for workspace ${workspaceId}`,
        );
      } else {
        await this.createStageHistoryField(workspaceId);
      }
    } else {
      this.logger.log(
        `Opportunity stageHistory field already present for workspace ${workspaceId}`,
      );
    }

    if (!dataSource) {
      this.logger.log(
        `No data source for workspace ${workspaceId}, skipping backfill`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would backfill Opportunity stageHistory for workspace ${workspaceId}`,
      );

      return;
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);

    const stageHistoryResult = await dataSource.query(
      `UPDATE "${schemaName}"."opportunity"
       SET "stageHistory" = jsonb_build_array(
         jsonb_build_object(
           'stage', "stage",
           'enteredAt', to_char(
             COALESCE("stageChangedAt", "createdAt") AT TIME ZONE 'UTC',
             'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
           )
         )
       )
       WHERE "stageHistory" IS NULL`,
      undefined,
      undefined,
      { shouldBypassPermissionChecks: true },
    );

    this.logger.log(
      `Backfilled stageHistory for ${stageHistoryResult?.[1] ?? 0} opportunities in workspace ${workspaceId}`,
    );
  }

  private async createStageHistoryField(workspaceId: string): Promise<void> {
    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const standardStageHistoryFlatFieldMetadata =
      findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
        flatEntityMaps: standardAllFlatEntityMaps.flatFieldMetadataMaps,
        universalIdentifier: STAGE_HISTORY_FIELD_UNIVERSAL_IDENTIFIER,
      });

    if (!isDefined(standardStageHistoryFlatFieldMetadata)) {
      throw new Error(
        `Standard application is missing the Opportunity stageHistory field`,
      );
    }

    // stageHistory has no engine-owned companions (not searchable, not the
    // label identifier, no standard view fields), so the legacy migration
    // applies the matrix literally instead of the default side-effect engine.
    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: [standardStageHistoryFlatFieldMetadata],
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
          workspaceId,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
        },
      );

    if (validateAndBuildResult.status === 'fail') {
      this.logger.error(
        `Failed to create Opportunity stageHistory field:\n${JSON.stringify(
          validateAndBuildResult,
          null,
          2,
        )}`,
      );

      throw new Error(
        `Failed to create Opportunity stageHistory field for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Created Opportunity stageHistory field for workspace ${workspaceId}`,
    );
  }
}
