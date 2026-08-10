import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { ProductCapabilityKey } from 'twenty-shared/types';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import {
  CapabilityGuard,
  RequireCapability,
} from 'src/engine/guards/capability.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { PageLayoutGraphqlApiExceptionFilter } from 'src/engine/metadata-modules/page-layout/utils/page-layout-graphql-api-exception.filter';
import { DuplicatedDashboardDTO } from 'src/modules/dashboard/dtos/duplicated-dashboard.dto';
import { DashboardDuplicationService } from 'src/modules/dashboard/services/dashboard-duplication.service';
import { DashboardGraphqlApiExceptionFilter } from 'src/modules/dashboard/utils/dashboard-graphql-api-exception.filter';

@MetadataResolver()
@UseFilters(
  DashboardGraphqlApiExceptionFilter,
  PageLayoutGraphqlApiExceptionFilter,
)
@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
export class DashboardResolver {
  constructor(
    private readonly dashboardDuplicationService: DashboardDuplicationService,
  ) {}

  @Mutation(() => DuplicatedDashboardDTO)
  // CapabilityGuard runs after the class-level WorkspaceAuthGuard, so
  // req.workspace.id is populated before the capability check.
  @UseGuards(NoPermissionGuard, CapabilityGuard)
  @RequireCapability(ProductCapabilityKey.DASHBOARDS)
  async duplicateDashboard(
    @Args('id', { type: () => UUIDScalarType }) id: string,
  ): Promise<DuplicatedDashboardDTO> {
    const authContext = getWorkspaceAuthContext();

    return this.dashboardDuplicationService.duplicateDashboard(id, authContext);
  }
}
