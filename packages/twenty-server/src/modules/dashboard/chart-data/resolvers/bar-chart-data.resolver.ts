import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { ProductCapabilityKey } from 'twenty-shared/types';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import {
  CapabilityGuard,
  RequireCapability,
} from 'src/engine/guards/capability.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { BarChartDataDTO } from 'src/modules/dashboard/chart-data/dtos/bar-chart-data.dto';
import { BarChartDataInput } from 'src/modules/dashboard/chart-data/dtos/inputs/bar-chart-data.input';
import { ChartDataGraphqlApiExceptionFilter } from 'src/modules/dashboard/chart-data/filters/chart-data-graphql-api-exception.filter';
import { BarChartDataService } from 'src/modules/dashboard/chart-data/services/bar-chart-data.service';

@MetadataResolver()
@UseFilters(ChartDataGraphqlApiExceptionFilter)
@UseGuards(WorkspaceAuthGuard)
@UsePipes(ResolverValidationPipe)
export class BarChartDataResolver {
  constructor(private readonly barChartDataService: BarChartDataService) {}

  @Query(() => BarChartDataDTO)
  // CapabilityGuard runs after the class-level WorkspaceAuthGuard, so
  // req.workspace.id is populated before the capability check.
  @UseGuards(NoPermissionGuard, CapabilityGuard)
  @RequireCapability(ProductCapabilityKey.DASHBOARDS)
  async barChartData(
    @Args('input') input: BarChartDataInput,
  ): Promise<BarChartDataDTO> {
    const authContext = getWorkspaceAuthContext();

    return this.barChartDataService.getBarChartData({
      objectMetadataId: input.objectMetadataId,
      configuration: input.configuration,
      workspaceId: authContext.workspace.id,
      authContext,
    });
  }
}
