import { Module } from '@nestjs/common';

import { OpportunitySetProbabilityJob } from 'src/modules/opportunity/jobs/opportunity-set-probability.job';
import { OpportunitySetStageChangedAtJob } from 'src/modules/opportunity/jobs/opportunity-set-stage-changed-at.job';
import { OpportunityProbabilityConfigModule } from 'src/modules/opportunity/opportunity-probability-config.module';

// Job processors must live in the worker's module graph (JobsModule), not only
// in OpportunityModule (server graph). Otherwise the queue worker consumes these
// jobs as no-ops and the writes never persist.
@Module({
  imports: [OpportunityProbabilityConfigModule],
  providers: [OpportunitySetStageChangedAtJob, OpportunitySetProbabilityJob],
})
export class OpportunityJobModule {}
