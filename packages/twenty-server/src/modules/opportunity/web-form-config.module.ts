import { Module } from '@nestjs/common';

import { KeyValuePairModule } from 'src/engine/core-modules/key-value-pair/key-value-pair.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WebFormConfigResolver } from 'src/modules/opportunity/resolvers/web-form-config.resolver';
import { WebFormConfigService } from 'src/modules/opportunity/services/web-form-config.service';

@Module({
  imports: [KeyValuePairModule, PermissionsModule],
  providers: [WebFormConfigService, WebFormConfigResolver],
  exports: [WebFormConfigService],
})
export class WebFormConfigModule {}
