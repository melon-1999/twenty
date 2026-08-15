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

const STAGE_CHANGED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  OPPORTUNITY.fields.stageChangedAt.universalIdentifier;

@RegisteredWorkspaceCommand('2.32.0', 1786500000000)
@Command({
  name: 'upgrade:2-32:backfill-opportunity-stage-changed-at',
  description:
    'Add the Opportunity stageChangedAt field and backfill it to createdAt on existing rows',
})
export class BackfillOpportunityStageChangedAtCommand extends ProvisionedWorkspaceCommandRunner {
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

    const fieldAlreadyExists = isDefined(
      flatFieldMetadataMaps.byUniversalIdentifier[
        STAGE_CHANGED_AT_FIELD_UNIVERSAL_IDENTIFIER
      ],
    );

    if (!fieldAlreadyExists) {
      if (isDryRun) {
        this.logger.log(
          `[DRY RUN] Would create Opportunity stageChangedAt field for workspace ${workspaceId}`,
        );
      } else {
        await this.createStageChangedAtField(workspaceId);
      }
    } else {
      this.logger.log(
        `Opportunity stageChangedAt field already present for workspace ${workspaceId}`,
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
        `[DRY RUN] Would backfill Opportunity stageChangedAt for workspace ${workspaceId}`,
      );

      return;
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);

    const result = await dataSource.query(
      `UPDATE "${schemaName}"."opportunity"
       SET "stageChangedAt" = "createdAt"
       WHERE "stageChangedAt" IS NULL`,
      undefined,
      undefined,
      { shouldBypassPermissionChecks: true },
    );

    this.logger.log(
      `Backfilled stageChangedAt for ${result?.[1] ?? 0} opportunities in workspace ${workspaceId}`,
    );
  }

  private async createStageChangedAtField(workspaceId: string): Promise<void> {
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

    const standardFlatFieldMetadata =
      findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
        flatEntityMaps: standardAllFlatEntityMaps.flatFieldMetadataMaps,
        universalIdentifier: STAGE_CHANGED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      });

    if (!isDefined(standardFlatFieldMetadata)) {
      throw new Error(
        `Standard application is missing the Opportunity stageChangedAt field`,
      );
    }

    // stageChangedAt has no engine-owned companions (not searchable, not the
    // label identifier, no standard view fields), so the legacy migration
    // applies the matrix literally instead of the default side-effect engine.
    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: [standardFlatFieldMetadata],
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
        `Failed to create Opportunity stageChangedAt field:\n${JSON.stringify(
          validateAndBuildResult,
          null,
          2,
        )}`,
      );

      throw new Error(
        `Failed to create Opportunity stageChangedAt field for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Created Opportunity stageChangedAt field for workspace ${workspaceId}`,
    );
  }
}
