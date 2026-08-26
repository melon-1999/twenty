import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  DEFAULT_OPPORTUNITY_STAGE_PROBABILITY,
  OpportunityProbabilityConfigService,
} from 'src/modules/opportunity/services/opportunity-probability-config.service';
import {
  OPPORTUNITY_STAGE_PROBABILITY_KEY,
  type OpportunityStageProbabilityKeyValueTypeMap,
} from 'src/modules/opportunity/types/opportunity-stage-probability-key-value.type';

describe('OpportunityProbabilityConfigService', () => {
  const workspaceId = 'workspace-id';

  let service: OpportunityProbabilityConfigService;
  let keyValueGet: jest.Mock;
  let keyValueSet: jest.Mock;

  beforeEach(() => {
    keyValueGet = jest.fn();
    keyValueSet = jest.fn();

    const keyValuePairService = {
      get: keyValueGet,
      set: keyValueSet,
    } as unknown as KeyValuePairService<OpportunityStageProbabilityKeyValueTypeMap>;

    service = new OpportunityProbabilityConfigService(keyValuePairService);
  });

  describe('getProbabilityByStage', () => {
    it('returns the default map when nothing is stored', async () => {
      keyValueGet.mockResolvedValue([]);

      const result = await service.getProbabilityByStage(workspaceId);

      expect(result).toEqual(DEFAULT_OPPORTUNITY_STAGE_PROBABILITY);
      expect(keyValueGet).toHaveBeenCalledWith({
        userId: null,
        workspaceId,
        type: KeyValuePairType.CONFIG_VARIABLE,
        key: OPPORTUNITY_STAGE_PROBABILITY_KEY,
      });
    });

    it('returns the stored map when present (empty object respected)', async () => {
      keyValueGet.mockResolvedValue([{ value: { NEW: 5 } }]);

      const result = await service.getProbabilityByStage(workspaceId);

      expect(result).toEqual({ NEW: 5 });
    });
  });

  describe('setProbabilityByStage', () => {
    it('persists via setProbabilityByStage', async () => {
      const config = { NEW: 15 };

      keyValueSet.mockResolvedValue(undefined);

      const result = await service.setProbabilityByStage(workspaceId, config);

      expect(keyValueSet).toHaveBeenCalledWith(
        expect.objectContaining({ value: config }),
      );
      expect(result).toEqual(config);
    });
  });
});
