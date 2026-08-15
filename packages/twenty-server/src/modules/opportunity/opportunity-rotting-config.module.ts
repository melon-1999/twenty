import { Module } from '@nestjs/common';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { OpportunityRottingConfigResolver } from 'src/modules/opportunity/resolvers/opportunity-rotting-config.resolver';
import { OpportunityRottingConfigService } from 'src/modules/opportunity/services/opportunity-rotting-config.service';

@Module({
  imports: [KeyValuePairModule, PermissionsModule],
  providers: [
    OpportunityRottingConfigService,
    OpportunityRottingConfigResolver,
  ],
})
export class OpportunityRottingConfigModule {}
