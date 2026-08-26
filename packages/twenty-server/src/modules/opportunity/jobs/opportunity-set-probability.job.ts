import { Logger, Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import {
  computeTargetProbability,
  computeWeightedAmount,
  isSameWeightedAmount,
} from 'src/modules/opportunity/listeners/opportunity-probability.util';
import { OpportunityProbabilityConfigService } from 'src/modules/opportunity/services/opportunity-probability-config.service';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

export type OpportunitySetProbabilityJobData = {
  workspaceId: string;
  opportunityId: string;
  isCreate: boolean;
  stageBefore: string | null;
  probabilityBefore: number | null;
};

@Processor({
  queueName: MessageQueue.entityEventsToDbQueue,
  scope: Scope.REQUEST,
})
export class OpportunitySetProbabilityJob {
  protected readonly logger = new Logger(OpportunitySetProbabilityJob.name);

  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly probabilityConfigService: OpportunityProbabilityConfigService,
  ) {}

  @Process(OpportunitySetProbabilityJob.name)
  async handle({
    workspaceId,
    opportunityId,
    isCreate,
    stageBefore,
    probabilityBefore,
  }: OpportunitySetProbabilityJobData): Promise<void> {
    const stageDefaults =
      await this.probabilityConfigService.getProbabilityByStage(workspaceId);
    const authContext = buildSystemAuthContext(workspaceId);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        await this.globalWorkspaceOrmManager.getRepository<OpportunityWorkspaceEntity>(
          workspaceId,
          'opportunity',
          { shouldBypassPermissionChecks: true },
        );

      const opportunity = await repository.findOne({
        where: { id: opportunityId },
      });

      if (opportunity === null) {
        return;
      }

      const targetProbability = computeTargetProbability({
        isCreate,
        stageBefore,
        stageAfter: opportunity.stage,
        probabilityBefore,
        currentProbability: opportunity.probability,
        stageDefaults,
      });
      const targetWeighted = computeWeightedAmount(
        opportunity.amount,
        targetProbability,
      );

      const probabilitySame = opportunity.probability === targetProbability;
      const weightedSame = isSameWeightedAmount(
        opportunity.weightedAmount,
        targetWeighted,
      );

      if (probabilitySame && weightedSame) {
        return;
      }

      await repository.update(
        { id: opportunityId },
        { probability: targetProbability, weightedAmount: targetWeighted },
      );
    }, authContext);
  }
}
