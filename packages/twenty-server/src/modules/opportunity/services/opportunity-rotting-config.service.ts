import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  OPPORTUNITY_STAGE_ROTTING_DAYS_KEY,
  type OpportunityStageRottingDays,
  type OpportunityStageRottingDaysKeyValueTypeMap,
} from 'src/modules/opportunity/types/opportunity-stage-rotting-days-key-value.type';

export const DEFAULT_OPPORTUNITY_STAGE_ROTTING_DAYS: OpportunityStageRottingDays =
  {
    NEW: 7,
    SCREENING: 14,
    MEETING: 14,
    PROPOSAL: 21,
    CUSTOMER: 30,
  };

@Injectable()
export class OpportunityRottingConfigService {
  constructor(
    private readonly keyValuePairService: KeyValuePairService<OpportunityStageRottingDaysKeyValueTypeMap>,
  ) {}

  async getRottingDays(
    workspaceId: string,
  ): Promise<OpportunityStageRottingDays> {
    const storedRottingDays = await this.keyValuePairService.get({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: OPPORTUNITY_STAGE_ROTTING_DAYS_KEY,
    });

    const storedValue = (
      storedRottingDays[0] as
        | { value?: OpportunityStageRottingDays }
        | undefined
    )?.value;

    return storedValue ?? DEFAULT_OPPORTUNITY_STAGE_ROTTING_DAYS;
  }

  async setRottingDays(
    workspaceId: string,
    config: OpportunityStageRottingDays,
  ): Promise<OpportunityStageRottingDays> {
    await this.keyValuePairService.set({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: OPPORTUNITY_STAGE_ROTTING_DAYS_KEY,
      value: config,
    });

    return config;
  }
}
