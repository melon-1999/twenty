import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { OpportunityMonthlyGoalConfigService } from 'src/modules/opportunity/services/opportunity-monthly-goal-config.service';
import {
  OPPORTUNITY_MONTHLY_GOAL_KEY,
  type OpportunityMonthlyGoalKeyValueTypeMap,
} from 'src/modules/opportunity/types/opportunity-monthly-goal-key-value.type';

describe('OpportunityMonthlyGoalConfigService', () => {
  const workspaceId = 'workspace-id';

  let service: OpportunityMonthlyGoalConfigService;
  let keyValueGet: jest.Mock;
  let keyValueSet: jest.Mock;

  beforeEach(() => {
    keyValueGet = jest.fn();
    keyValueSet = jest.fn();

    const keyValuePairService = {
      get: keyValueGet,
      set: keyValueSet,
    } as unknown as KeyValuePairService<OpportunityMonthlyGoalKeyValueTypeMap>;

    service = new OpportunityMonthlyGoalConfigService(keyValuePairService);
  });

  describe('getMonthlyGoal', () => {
    it('returns null when nothing is stored', async () => {
      keyValueGet.mockResolvedValue([]);

      const result = await service.getMonthlyGoal(workspaceId);

      expect(result).toBeNull();
      expect(keyValueGet).toHaveBeenCalledWith({
        userId: null,
        workspaceId,
        type: KeyValuePairType.CONFIG_VARIABLE,
        key: OPPORTUNITY_MONTHLY_GOAL_KEY,
      });
    });

    it('returns the stored value when present', async () => {
      keyValueGet.mockResolvedValue([{ value: { targetAmount: 100000 } }]);

      const result = await service.getMonthlyGoal(workspaceId);

      expect(result).toEqual({ targetAmount: 100000 });
    });
  });

  describe('setMonthlyGoal', () => {
    it('persists via keyValuePairService.set and returns the config', async () => {
      const config = { targetAmount: 50000 };

      keyValueSet.mockResolvedValue(undefined);

      const result = await service.setMonthlyGoal(workspaceId, config);

      expect(keyValueSet).toHaveBeenCalledWith({
        userId: null,
        workspaceId,
        type: KeyValuePairType.CONFIG_VARIABLE,
        key: OPPORTUNITY_MONTHLY_GOAL_KEY,
        value: config,
      });
      expect(result).toEqual(config);
    });
  });
});
