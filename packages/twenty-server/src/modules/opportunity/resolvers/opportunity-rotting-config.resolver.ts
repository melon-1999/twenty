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
import { UpdateOpportunityStageRottingDaysInput } from 'src/modules/opportunity/dtos/update-opportunity-stage-rotting-days.input';
import { OpportunityRottingConfigService } from 'src/modules/opportunity/services/opportunity-rotting-config.service';
import { type OpportunityStageRottingDays } from 'src/modules/opportunity/types/opportunity-stage-rotting-days-key-value.type';

@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class OpportunityRottingConfigResolver {
  constructor(
    private readonly opportunityRottingConfigService: OpportunityRottingConfigService,
  ) {}

  @UseGuards(NoPermissionGuard)
  @Query(() => GraphQLJSON)
  async opportunityStageRottingDays(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<OpportunityStageRottingDays> {
    return this.opportunityRottingConfigService.getRottingDays(workspaceId);
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  @Mutation(() => GraphQLJSON)
  async updateOpportunityStageRottingDays(
    @Args('input') input: UpdateOpportunityStageRottingDaysInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<OpportunityStageRottingDays> {
    return this.opportunityRottingConfigService.setRottingDays(
      workspaceId,
      input.config,
    );
  }
}
