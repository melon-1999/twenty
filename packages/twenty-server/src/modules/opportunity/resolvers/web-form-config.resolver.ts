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
import { UpdateWebFormsInput } from 'src/modules/opportunity/dtos/update-web-forms.input';
import { WebFormConfigService } from 'src/modules/opportunity/services/web-form-config.service';
import { type WebFormsConfig } from 'src/modules/opportunity/types/web-form-key-value.type';

@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
@MetadataResolver()
export class WebFormConfigResolver {
  constructor(private readonly webFormConfigService: WebFormConfigService) {}

  @UseGuards(NoPermissionGuard)
  @Query(() => GraphQLJSON)
  async webForms(
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<WebFormsConfig> {
    return this.webFormConfigService.getWebForms(workspaceId);
  }

  @UseGuards(SettingsPermissionGuard(PermissionFlagType.DATA_MODEL))
  @Mutation(() => GraphQLJSON)
  async updateWebForms(
    @Args('input') input: UpdateWebFormsInput,
    @AuthWorkspace() { id: workspaceId }: WorkspaceEntity,
  ): Promise<WebFormsConfig> {
    return this.webFormConfigService.setWebForms(workspaceId, input.value);
  }
}
