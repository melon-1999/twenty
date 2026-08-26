import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  OPPORTUNITY_STAGE_PROBABILITY_KEY,
  type OpportunityStageProbability,
  type OpportunityStageProbabilityKeyValueTypeMap,
} from 'src/modules/opportunity/types/opportunity-stage-probability-key-value.type';

export const DEFAULT_OPPORTUNITY_STAGE_PROBABILITY: OpportunityStageProbability =
  {
    NEW: 20,
    SCREENING: 40,
    MEETING: 60,
    PROPOSAL: 80,
    CUSTOMER: 100,
  };

@Injectable()
export class OpportunityProbabilityConfigService {
  constructor(
    private readonly keyValuePairService: KeyValuePairService<OpportunityStageProbabilityKeyValueTypeMap>,
  ) {}

  async getProbabilityByStage(
    workspaceId: string,
  ): Promise<OpportunityStageProbability> {
    const storedProbability = await this.keyValuePairService.get({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: OPPORTUNITY_STAGE_PROBABILITY_KEY,
    });

    const storedValue = (
      storedProbability[0] as
        | { value?: OpportunityStageProbability }
        | undefined
    )?.value;

    return storedValue ?? DEFAULT_OPPORTUNITY_STAGE_PROBABILITY;
  }

  async setProbabilityByStage(
    workspaceId: string,
    config: OpportunityStageProbability,
  ): Promise<OpportunityStageProbability> {
    await this.keyValuePairService.set({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: OPPORTUNITY_STAGE_PROBABILITY_KEY,
      value: config,
    });

    return config;
  }
}
