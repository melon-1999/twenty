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
import { UpdateOpportunityStageProbabilityInput } from 'src/modules/opportunity/dtos/update-opportunity-stage-probability.input';
import { OpportunityProbabilityConfigService } from 'src/modules/opportunity/services/opportunity-probability-config.service';
import { type OpportunityStageProbability } from 'src/modules/opportunity/types/opportunity-stage-probability-key-value.type';

@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class OpportunityProbabilityConfigResolver {
  constructor(
    private readonly opportunityProbabilityConfigService: OpportunityProbabilityConfigService,
  ) {}

  @UseGuards(NoPermissionGuard)
  @Query(() => GraphQLJSON)
  async opportunityStageProbability(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<OpportunityStageProbability> {
    return this.opportunityProbabilityConfigService.getProbabilityByStage(
      workspaceId,
    );
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  @Mutation(() => GraphQLJSON)
  async updateOpportunityStageProbability(
    @Args('input') input: UpdateOpportunityStageProbabilityInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<OpportunityStageProbability> {
    return this.opportunityProbabilityConfigService.setProbabilityByStage(
      workspaceId,
      input.value,
    );
  }
}
