import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  DEFAULT_OPPORTUNITY_STAGE_ROTTING_DAYS,
  OpportunityRottingConfigService,
} from 'src/modules/opportunity/services/opportunity-rotting-config.service';
import {
  OPPORTUNITY_STAGE_ROTTING_DAYS_KEY,
  type OpportunityStageRottingDaysKeyValueTypeMap,
} from 'src/modules/opportunity/types/opportunity-stage-rotting-days-key-value.type';

describe('OpportunityRottingConfigService', () => {
  const workspaceId = 'workspace-id';

  let service: OpportunityRottingConfigService;
  let keyValueGet: jest.Mock;
  let keyValueSet: jest.Mock;

  beforeEach(() => {
    keyValueGet = jest.fn();
    keyValueSet = jest.fn();

    const keyValuePairService = {
      get: keyValueGet,
      set: keyValueSet,
    } as unknown as KeyValuePairService<OpportunityStageRottingDaysKeyValueTypeMap>;

    service = new OpportunityRottingConfigService(keyValuePairService);
  });

  describe('getRottingDays', () => {
    it('returns defaults when unset', async () => {
      keyValueGet.mockResolvedValue([]);

      const result = await service.getRottingDays(workspaceId);

      expect(result).toEqual(DEFAULT_OPPORTUNITY_STAGE_ROTTING_DAYS);
      expect(keyValueGet).toHaveBeenCalledWith({
        userId: null,
        workspaceId,
        type: KeyValuePairType.CONFIG_VARIABLE,
        key: OPPORTUNITY_STAGE_ROTTING_DAYS_KEY,
      });
    });

    it('returns the stored config when set', async () => {
      keyValueGet.mockResolvedValue([{ value: { NEW: 3 } }]);

      const result = await service.getRottingDays(workspaceId);

      expect(result).toEqual({ NEW: 3 });
    });
  });

  describe('setRottingDays', () => {
    it('persists the config via KeyValuePairService.set and returns it', async () => {
      const config = { NEW: 5, SCREENING: 10 };

      keyValueSet.mockResolvedValue(undefined);

      const result = await service.setRottingDays(workspaceId, config);

      expect(keyValueSet).toHaveBeenCalledWith({
        userId: null,
        workspaceId,
        type: KeyValuePairType.CONFIG_VARIABLE,
        key: OPPORTUNITY_STAGE_ROTTING_DAYS_KEY,
        value: config,
      });
      expect(result).toEqual(config);
    });
  });
});
