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
import { UpdateOpportunityMonthlyGoalInput } from 'src/modules/opportunity/dtos/update-opportunity-monthly-goal.input';
import { OpportunityMonthlyGoalConfigService } from 'src/modules/opportunity/services/opportunity-monthly-goal-config.service';
import { type OpportunityMonthlyGoal } from 'src/modules/opportunity/types/opportunity-monthly-goal-key-value.type';

@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class OpportunityMonthlyGoalConfigResolver {
  constructor(
    private readonly opportunityMonthlyGoalConfigService: OpportunityMonthlyGoalConfigService,
  ) {}

  @UseGuards(NoPermissionGuard)
  @Query(() => GraphQLJSON, { nullable: true })
  async opportunityMonthlyGoal(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<OpportunityMonthlyGoal | null> {
    return this.opportunityMonthlyGoalConfigService.getMonthlyGoal(workspaceId);
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  @Mutation(() => GraphQLJSON)
  async updateOpportunityMonthlyGoal(
    @Args('input') input: UpdateOpportunityMonthlyGoalInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<OpportunityMonthlyGoal> {
    return this.opportunityMonthlyGoalConfigService.setMonthlyGoal(
      workspaceId,
      input.value,
    );
  }
}
