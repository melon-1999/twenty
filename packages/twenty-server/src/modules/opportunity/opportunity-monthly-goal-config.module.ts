import { Module } from '@nestjs/common';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { OpportunityMonthlyGoalConfigResolver } from 'src/modules/opportunity/resolvers/opportunity-monthly-goal-config.resolver';
import { OpportunityMonthlyGoalConfigService } from 'src/modules/opportunity/services/opportunity-monthly-goal-config.service';

@Module({
  imports: [KeyValuePairModule, PermissionsModule],
  providers: [
    OpportunityMonthlyGoalConfigService,
    OpportunityMonthlyGoalConfigResolver,
  ],
  exports: [OpportunityMonthlyGoalConfigService],
})
export class OpportunityMonthlyGoalConfigModule {}
