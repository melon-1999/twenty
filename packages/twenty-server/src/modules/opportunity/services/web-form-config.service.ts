import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  WEB_FORMS_KEY,
  type WebFormKeyValueTypeMap,
  type WebFormsConfig,
} from 'src/modules/opportunity/types/web-form-key-value.type';

@Injectable()
export class WebFormConfigService {
  constructor(
    private readonly keyValuePairService: KeyValuePairService<WebFormKeyValueTypeMap>,
  ) {}

  async getWebForms(workspaceId: string): Promise<WebFormsConfig> {
    const stored = await this.keyValuePairService.get({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: WEB_FORMS_KEY,
    });

    const value = (stored[0] as { value?: WebFormsConfig } | undefined)?.value;

    return value ?? { forms: [] };
  }

  async setWebForms(
    workspaceId: string,
    config: WebFormsConfig,
  ): Promise<WebFormsConfig> {
    await this.keyValuePairService.set({
      userId: null,
      workspaceId,
      type: KeyValuePairType.CONFIG_VARIABLE,
      key: WEB_FORMS_KEY,
      value: config,
    });

    return config;
  }
}
