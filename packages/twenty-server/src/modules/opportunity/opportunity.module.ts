import { Module } from '@nestjs/common';

import { OpportunityProbabilityListener } from 'src/modules/opportunity/listeners/opportunity-probability.listener';
import { OpportunityStageChangedListener } from 'src/modules/opportunity/listeners/opportunity-stage-changed.listener';

// Listeners run in the server graph (they react to DB events emitted by the API)
// and enqueue jobs by name. The job PROCESSORS live in OpportunityJobModule,
// which is registered in the worker graph (JobsModule) so they actually run.
@Module({
  providers: [OpportunityStageChangedListener, OpportunityProbabilityListener],
})
export class OpportunityModule {}
