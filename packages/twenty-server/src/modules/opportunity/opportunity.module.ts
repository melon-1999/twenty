import { Module } from '@nestjs/common';

import { OpportunitySetProbabilityJob } from 'src/modules/opportunity/jobs/opportunity-set-probability.job';
import { OpportunitySetStageChangedAtJob } from 'src/modules/opportunity/jobs/opportunity-set-stage-changed-at.job';
import { OpportunityProbabilityListener } from 'src/modules/opportunity/listeners/opportunity-probability.listener';
import { OpportunityStageChangedListener } from 'src/modules/opportunity/listeners/opportunity-stage-changed.listener';
import { OpportunityProbabilityConfigModule } from 'src/modules/opportunity/opportunity-probability-config.module';

@Module({
  imports: [OpportunityProbabilityConfigModule],
  providers: [
    OpportunityStageChangedListener,
    OpportunitySetStageChangedAtJob,
    OpportunityProbabilityListener,
    OpportunitySetProbabilityJob,
  ],
})
export class OpportunityModule {}
