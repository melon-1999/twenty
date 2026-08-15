import { Module } from '@nestjs/common';

import { OpportunitySetStageChangedAtJob } from 'src/modules/opportunity/jobs/opportunity-set-stage-changed-at.job';
import { OpportunityStageChangedListener } from 'src/modules/opportunity/listeners/opportunity-stage-changed.listener';

@Module({
  providers: [OpportunityStageChangedListener, OpportunitySetStageChangedAtJob],
})
export class OpportunityModule {}
