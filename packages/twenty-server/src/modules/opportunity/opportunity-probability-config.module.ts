import { Module } from '@nestjs/common';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { OpportunityProbabilityConfigResolver } from 'src/modules/opportunity/resolvers/opportunity-probability-config.resolver';
import { OpportunityProbabilityConfigService } from 'src/modules/opportunity/services/opportunity-probability-config.service';

@Module({
  imports: [KeyValuePairModule, PermissionsModule],
  providers: [
    OpportunityProbabilityConfigService,
    OpportunityProbabilityConfigResolver,
  ],
})
export class OpportunityProbabilityConfigModule {}
