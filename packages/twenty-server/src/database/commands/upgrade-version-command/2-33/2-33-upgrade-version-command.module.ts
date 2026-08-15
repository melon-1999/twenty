import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { LocalizeOpportunityStageLabelsDeCommand } from 'src/database/commands/upgrade-version-command/2-33/2-33-workspace-command-1786600000000-localize-opportunity-stage-labels-de.command';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [WorkspaceIteratorModule, WorkspaceCacheModule, FieldMetadataModule],
  providers: [LocalizeOpportunityStageLabelsDeCommand],
})
export class V2_33_UpgradeVersionCommandModule {}
