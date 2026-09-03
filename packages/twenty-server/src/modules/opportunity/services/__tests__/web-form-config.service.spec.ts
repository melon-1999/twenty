import { Test, type TestingModule } from '@nestjs/testing';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { WebFormConfigService } from 'src/modules/opportunity/services/web-form-config.service';
import {
  WEB_FORMS_KEY,
  type WebFormsConfig,
} from 'src/modules/opportunity/types/web-form-key-value.type';

describe('WebFormConfigService', () => {
  const workspaceId = 'ws-1';
  let service: WebFormConfigService;
  const get = jest.fn();
  const set = jest.fn();

  beforeEach(async () => {
    get.mockReset();
    set.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebFormConfigService,
        { provide: KeyValuePairService, useValue: { get, set } },
      ],
    }).compile();
    service = module.get(WebFormConfigService);
  });

  it('returns an empty forms array when nothing is stored', async () => {
    get.mockResolvedValue([]);

    await expect(service.getWebForms(workspaceId)).resolves.toEqual({
      forms: [],
    });
    expect(get).toHaveBeenCalledWith({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: WEB_FORMS_KEY,
    });
  });

  it('returns the stored config', async () => {
    const stored: WebFormsConfig = {
      forms: [
        {
          id: 'f1',
          title: 'Kontakt',
          description: '',
          enabled: true,
          stage: 'NEW',
          dealNameTemplate: 'Web-Lead: {firstName} {lastName}',
          thankYouText: 'Danke!',
        },
      ],
    };

    get.mockResolvedValue([{ value: stored }]);

    await expect(service.getWebForms(workspaceId)).resolves.toEqual(stored);
  });

  it('persists the config and returns it', async () => {
    const config: WebFormsConfig = { forms: [] };

    set.mockResolvedValue(undefined);

    await expect(service.setWebForms(workspaceId, config)).resolves.toEqual(
      config,
    );
    expect(set).toHaveBeenCalledWith({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: WEB_FORMS_KEY,
      value: config,
    });
  });
});
