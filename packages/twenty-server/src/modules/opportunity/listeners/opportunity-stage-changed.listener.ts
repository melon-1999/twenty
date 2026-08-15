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
  OpportunitySetStageChangedAtJob,
  type OpportunitySetStageChangedAtJobData,
} from 'src/modules/opportunity/jobs/opportunity-set-stage-changed-at.job';
import { shouldResetStageChangedAt } from 'src/modules/opportunity/listeners/opportunity-stage-changed.util';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';

@Injectable()
export class OpportunityStageChangedListener {
  constructor(
    @InjectMessageQueue(MessageQueue.entityEventsToDbQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.CREATED)
  async handleCreatedEvent(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<OpportunityWorkspaceEntity>
    >,
  ) {
    for (const eventPayload of payload.events) {
      const stageChangedAt =
        eventPayload.properties.after.createdAt ?? new Date().toISOString();

      await this.messageQueueService.add<OpportunitySetStageChangedAtJobData>(
        OpportunitySetStageChangedAtJob.name,
        {
          workspaceId: payload.workspaceId,
          opportunityId: eventPayload.recordId,
          stageChangedAt,
        },
      );
    }
  }

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async handleUpdatedEvent(
    payload: WorkspaceEventBatch<
      ObjectRecordUpdateEvent<OpportunityWorkspaceEntity>
    >,
  ) {
    for (const eventPayload of payload.events) {
      // Recursion guard: shouldResetStageChangedAt is false for a write that
      // only sets stageChangedAt, so this job's own update never re-enqueues.
      if (
        !shouldResetStageChangedAt(
          eventPayload.properties.before,
          eventPayload.properties.after,
        )
      ) {
        continue;
      }

      await this.messageQueueService.add<OpportunitySetStageChangedAtJobData>(
        OpportunitySetStageChangedAtJob.name,
        {
          workspaceId: payload.workspaceId,
          opportunityId: eventPayload.recordId,
          stageChangedAt: new Date().toISOString(),
        },
      );
    }
  }
}
