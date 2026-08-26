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

const PROBABILITY_FIELD_UNIVERSAL_IDENTIFIER =
  OPPORTUNITY.fields.probability.universalIdentifier;
const WEIGHTED_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER =
  OPPORTUNITY.fields.weightedAmount.universalIdentifier;

const DEFAULT_STAGE_PROBABILITY = {
  NEW: 20,
  SCREENING: 40,
  MEETING: 60,
  PROPOSAL: 80,
  CUSTOMER: 100,
} as const;

@RegisteredWorkspaceCommand('2.34.0', 1786700000000)
@Command({
  name: 'upgrade:2-34:backfill-opportunity-probability',
  description:
    'Add the Opportunity probability and weightedAmount fields and backfill them on existing rows',
})
export class BackfillOpportunityProbabilityCommand extends ProvisionedWorkspaceCommandRunner {
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

    const probabilityFieldAlreadyExists = isDefined(
      flatFieldMetadataMaps.byUniversalIdentifier[
        PROBABILITY_FIELD_UNIVERSAL_IDENTIFIER
      ],
    );
    const weightedAmountFieldAlreadyExists = isDefined(
      flatFieldMetadataMaps.byUniversalIdentifier[
        WEIGHTED_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER
      ],
    );

    if (!probabilityFieldAlreadyExists || !weightedAmountFieldAlreadyExists) {
      if (isDryRun) {
        this.logger.log(
          `[DRY RUN] Would create Opportunity probability/weightedAmount fields for workspace ${workspaceId}`,
        );
      } else {
        await this.createProbabilityAndWeightedAmountFields(
          workspaceId,
          probabilityFieldAlreadyExists,
          weightedAmountFieldAlreadyExists,
        );
      }
    } else {
      this.logger.log(
        `Opportunity probability and weightedAmount fields already present for workspace ${workspaceId}`,
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
        `[DRY RUN] Would backfill Opportunity probability and weightedAmount for workspace ${workspaceId}`,
      );

      return;
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);

    const stageProbabilityCaseWhenClauses = Object.entries(
      DEFAULT_STAGE_PROBABILITY,
    )
      .map(([stage, probability]) => `WHEN '${stage}' THEN ${probability}`)
      .join(' ');

    const probabilityResult = await dataSource.query(
      `UPDATE "${schemaName}"."opportunity"
       SET "probability" = CASE "stage"
         ${stageProbabilityCaseWhenClauses} ELSE 0 END
       WHERE "probability" IS NULL`,
      undefined,
      undefined,
      { shouldBypassPermissionChecks: true },
    );

    const weightedAmountResult = await dataSource.query(
      `UPDATE "${schemaName}"."opportunity"
       SET "weightedAmountAmountMicros" = ROUND("amountAmountMicros" * "probability" / 100.0),
           "weightedAmountCurrencyCode" = "amountCurrencyCode"
       WHERE "amountAmountMicros" IS NOT NULL AND "weightedAmountAmountMicros" IS NULL`,
      undefined,
      undefined,
      { shouldBypassPermissionChecks: true },
    );

    this.logger.log(
      `Backfilled probability for ${probabilityResult?.[1] ?? 0} opportunities and weightedAmount for ${
        weightedAmountResult?.[1] ?? 0
      } opportunities in workspace ${workspaceId}`,
    );
  }

  private async createProbabilityAndWeightedAmountFields(
    workspaceId: string,
    probabilityFieldAlreadyExists: boolean,
    weightedAmountFieldAlreadyExists: boolean,
  ): Promise<void> {
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

    const flatFieldMetadataToCreate: FlatFieldMetadata[] = [];

    if (!probabilityFieldAlreadyExists) {
      const standardProbabilityFlatFieldMetadata =
        findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
          flatEntityMaps: standardAllFlatEntityMaps.flatFieldMetadataMaps,
          universalIdentifier: PROBABILITY_FIELD_UNIVERSAL_IDENTIFIER,
        });

      if (!isDefined(standardProbabilityFlatFieldMetadata)) {
        throw new Error(
          `Standard application is missing the Opportunity probability field`,
        );
      }

      flatFieldMetadataToCreate.push(standardProbabilityFlatFieldMetadata);
    }

    if (!weightedAmountFieldAlreadyExists) {
      const standardWeightedAmountFlatFieldMetadata =
        findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
          flatEntityMaps: standardAllFlatEntityMaps.flatFieldMetadataMaps,
          universalIdentifier: WEIGHTED_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
        });

      if (!isDefined(standardWeightedAmountFlatFieldMetadata)) {
        throw new Error(
          `Standard application is missing the Opportunity weightedAmount field`,
        );
      }

      flatFieldMetadataToCreate.push(standardWeightedAmountFlatFieldMetadata);
    }

    // probability and weightedAmount have no engine-owned companions (not
    // searchable, not the label identifier, no standard view fields), so the
    // legacy migration applies the matrix literally instead of the default
    // side-effect engine.
    const validateAndBuildResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: flatFieldMetadataToCreate,
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
        `Failed to create Opportunity probability/weightedAmount fields:\n${JSON.stringify(
          validateAndBuildResult,
          null,
          2,
        )}`,
      );

      throw new Error(
        `Failed to create Opportunity probability/weightedAmount fields for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Created Opportunity probability/weightedAmount fields for workspace ${workspaceId}`,
    );
  }
}
