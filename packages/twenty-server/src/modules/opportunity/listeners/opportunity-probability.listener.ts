import { Injectable } from '@nestjs/common';

import {
  type ObjectRecordCreateEvent,
  type ObjectRecordUpdateEvent,
} from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  OpportunitySetProbabilityJob,
  type OpportunitySetProbabilityJobData,
} from 'src/modules/opportunity/jobs/opportunity-set-probability.job';
import { shouldRecomputeProbability } from 'src/modules/opportunity/listeners/opportunity-probability.util';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

@Injectable()
export class OpportunityProbabilityListener {
  constructor(
    @InjectMessageQueue(MessageQueue.entityEventsToDbQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.CREATED)
  async handleCreatedEvent(
    payload: WorkspaceEventBatch<ObjectRecordCreateEvent<OpportunityWorkspaceEntity>>,
  ) {
    for (const eventPayload of payload.events) {
      await this.messageQueueService.add<OpportunitySetProbabilityJobData>(
        OpportunitySetProbabilityJob.name,
        {
          workspaceId: payload.workspaceId,
          opportunityId: eventPayload.recordId,
          isCreate: true,
          stageBefore: null,
          probabilityBefore: eventPayload.properties.after.probability ?? null,
        },
      );
    }
  }

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async handleUpdatedEvent(
    payload: WorkspaceEventBatch<ObjectRecordUpdateEvent<OpportunityWorkspaceEntity>>,
  ) {
    for (const eventPayload of payload.events) {
      const { before, after } = eventPayload.properties;

      // Recursion guard: shouldRecomputeProbability is false once this job's
      // own update has landed (no field it inspects differs), so this listener
      // does not re-enqueue after the job writes back.
      if (!shouldRecomputeProbability(before, after)) {
        continue;
      }

      await this.messageQueueService.add<OpportunitySetProbabilityJobData>(
        OpportunitySetProbabilityJob.name,
        {
          workspaceId: payload.workspaceId,
          opportunityId: eventPayload.recordId,
          isCreate: false,
          stageBefore: before.stage ?? null,
          probabilityBefore: before.probability ?? null,
        },
      );
    }
  }
}
