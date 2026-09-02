import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  OPPORTUNITY_MONTHLY_GOAL_KEY,
  type OpportunityMonthlyGoal,
  type OpportunityMonthlyGoalKeyValueTypeMap,
} from 'src/modules/opportunity/types/opportunity-monthly-goal-key-value.type';

@Injectable()
export class OpportunityMonthlyGoalConfigService {
  constructor(
    private readonly keyValuePairService: KeyValuePairService<OpportunityMonthlyGoalKeyValueTypeMap>,
  ) {}

  async getMonthlyGoal(
    workspaceId: string,
  ): Promise<OpportunityMonthlyGoal | null> {
    const stored = await this.keyValuePairService.get({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: OPPORTUNITY_MONTHLY_GOAL_KEY,
    });

    const value = (stored[0] as { value?: OpportunityMonthlyGoal } | undefined)
      ?.value;

    return value ?? null;
  }

  async setMonthlyGoal(
    workspaceId: string,
    config: OpportunityMonthlyGoal,
  ): Promise<OpportunityMonthlyGoal> {
    await this.keyValuePairService.set({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: OPPORTUNITY_MONTHLY_GOAL_KEY,
      value: config,
    });

    return config;
  }
}
