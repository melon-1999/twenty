import { Logger, Scope } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { reconcileStageHistory } from 'src/modules/opportunity/listeners/opportunity-stage-history.util';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

export type OpportunitySetStageChangedAtJobData = {
  workspaceId: string;
  opportunityId: string;
  stageChangedAt: string;
};

@Processor({
  queueName: MessageQueue.entityEventsToDbQueue,
  scope: Scope.REQUEST,
})
export class OpportunitySetStageChangedAtJob {
  protected readonly logger = new Logger(OpportunitySetStageChangedAtJob.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  @Process(OpportunitySetStageChangedAtJob.name)
  async handle({
    workspaceId,
    opportunityId,
    stageChangedAt,
  }: OpportunitySetStageChangedAtJobData): Promise<void> {
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const opportunityRepository =
        await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
          workspaceId,
          'opportunity',
          { shouldBypassPermissionChecks: true },
        );

      const opportunity = await opportunityRepository.findOne({
        where: { id: opportunityId },
      });

      if (!isDefined(opportunity)) {
        return;
      }

      // Same timestamp for enteredAt and stageChangedAt keeps the history
      // entry aligned with the stageChangedAt column.
      const nextStageHistory = reconcileStageHistory(
        opportunity.stage,
        opportunity.stageHistory,
        stageChangedAt,
      );

      await opportunityRepository.update(
        { id: opportunityId },
        {
          stageChangedAt: new Date(stageChangedAt),
          ...(isDefined(nextStageHistory)
            ? { stageHistory: nextStageHistory }
            : {}),
        },
      );
    }, authContext);
  }
}
