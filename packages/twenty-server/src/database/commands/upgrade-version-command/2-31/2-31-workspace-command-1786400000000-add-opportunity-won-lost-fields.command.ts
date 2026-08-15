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
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const OPPORTUNITY = STANDARD_OBJECTS.opportunity;

const STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  OPPORTUNITY.fields.status.universalIdentifier;
const CLOSED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  OPPORTUNITY.fields.closedAt.universalIdentifier;
const FIELD_UNIVERSAL_IDENTIFIERS_TO_CREATE = [
  STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  CLOSED_AT_FIELD_UNIVERSAL_IDENTIFIER,
];

@RegisteredWorkspaceCommand('2.31.0', 1786400000000)
@Command({
  name: 'upgrade:2-31:add-opportunity-won-lost-fields',
  description:
    'Add the Opportunity status and closedAt field metadata and columns to existing workspaces',
})
export class AddOpportunityWonLostFieldsCommand extends ProvisionedWorkspaceCommandRunner {
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

    const fieldsToCreate: FlatFieldMetadata[] = [];

    for (const fieldUniversalIdentifier of FIELD_UNIVERSAL_IDENTIFIERS_TO_CREATE) {
      if (
        isDefined(
          flatFieldMetadataMaps.byUniversalIdentifier[
            fieldUniversalIdentifier
          ],
        )
      ) {
        this.logger.log(
          `Opportunity field ${fieldUniversalIdentifier} already present for workspace ${workspaceId}`,
        );

        continue;
      }

      const standardFlatFieldMetadata =
        findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
          flatEntityMaps: standardAllFlatEntityMaps.flatFieldMetadataMaps,
          universalIdentifier: fieldUniversalIdentifier,
        });

      if (!isDefined(standardFlatFieldMetadata)) {
        throw new Error(
          `Standard application is missing the Opportunity field ${fieldUniversalIdentifier}`,
        );
      }

      fieldsToCreate.push(standardFlatFieldMetadata);
    }

    if (fieldsToCreate.length === 0) {
      this.logger.log(
        `Opportunity won/lost fields already configured for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would create ${fieldsToCreate.length} Opportunity field(s) for workspace ${workspaceId}`,
      );

      return;
    }

    // status/closedAt have no engine-owned companions (not searchable, not the
    // label identifier, no standard view fields), so the legacy migration
    // applies the matrix literally instead of the default side-effect engine.
    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: fieldsToCreate,
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
        `Failed to create Opportunity won/lost fields:\n${JSON.stringify(
          validateAndBuildResult,
          null,
          2,
        )}`,
      );

      throw new Error(
        `Failed to create Opportunity won/lost fields for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Created ${fieldsToCreate.length} Opportunity won/lost field(s) for workspace ${workspaceId}`,
    );
  }
}
