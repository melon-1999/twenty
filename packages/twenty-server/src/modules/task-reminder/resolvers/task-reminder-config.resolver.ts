import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import { PermissionFlagType } from 'twenty-shared/constants';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { SettingsPermissionGuard } from 'src/engine/guards/settings-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { UpdateTaskRemindersInput } from 'src/modules/task-reminder/dtos/update-task-reminders.input';
import { TaskReminderConfigService } from 'src/modules/task-reminder/services/task-reminder-config.service';
import { type TaskRemindersConfig } from 'src/modules/task-reminder/types/task-reminders-key-value.type';

@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class TaskReminderConfigResolver {
  constructor(
    private readonly taskReminderConfigService: TaskReminderConfigService,
  ) {}

  @UseGuards(NoPermissionGuard)
  @Query(() => GraphQLJSON)
  async taskReminders(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TaskRemindersConfig> {
    return this.taskReminderConfigService.getConfig(workspaceId);
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  @Mutation(() => GraphQLJSON)
  async updateTaskReminders(
    @Args('input') input: UpdateTaskRemindersInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<TaskRemindersConfig> {
    return this.taskReminderConfigService.setConfig(workspaceId, input.value);
  }
}
