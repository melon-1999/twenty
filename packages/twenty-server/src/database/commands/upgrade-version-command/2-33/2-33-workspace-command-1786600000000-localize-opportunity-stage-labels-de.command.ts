import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

const OPPORTUNITY = STANDARD_OBJECTS.opportunity;
const STAGE_FIELD_UNIVERSAL_IDENTIFIER = OPPORTUNITY.fields.stage.universalIdentifier;

// German labels keyed by the canonical (English) stage option value. Values,
// ids, colors and positions are preserved so all value-based logic keeps working.
const GERMAN_LABEL_BY_STAGE_VALUE: Record<string, string> = {
  NEW: 'Neu',
  SCREENING: 'Qualifizierung',
  MEETING: 'Termin',
  PROPOSAL: 'Angebot',
  CUSTOMER: 'Kunde',
};

@RegisteredWorkspaceCommand('2.33.0', 1786600000000)
@Command({
  name: 'upgrade:2-33:localize-opportunity-stage-labels-de',
  description:
    'Set German labels on the Opportunity stage options while keeping their English values',
})
export class LocalizeOpportunityStageLabelsDeCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly fieldMetadataService: FieldMetadataService,
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

    const stageFieldMetadata =
      findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
        flatEntityMaps: flatFieldMetadataMaps,
        universalIdentifier: STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      });

    if (!isDefined(stageFieldMetadata) || !isDefined(stageFieldMetadata.options)) {
      this.logger.log(
        `Opportunity stage field not found for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    const nextOptions = stageFieldMetadata.options.map((option) => {
      const germanLabel = GERMAN_LABEL_BY_STAGE_VALUE[option.value];

      return isDefined(germanLabel) ? { ...option, label: germanLabel } : option;
    });

    const alreadyLocalized = nextOptions.every(
      (option, index) => option.label === stageFieldMetadata.options?.[index].label,
    );

    if (alreadyLocalized) {
      this.logger.log(
        `Opportunity stage labels already localized for workspace ${workspaceId}`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would localize Opportunity stage labels for workspace ${workspaceId}`,
      );

      return;
    }

    await this.fieldMetadataService.updateOneField({
      updateFieldInput: {
        id: stageFieldMetadata.id,
        options: nextOptions,
      },
      workspaceId,
      isSystemBuild: true,
    });

    this.logger.log(
      `Localized Opportunity stage labels for workspace ${workspaceId}`,
    );
  }
}
