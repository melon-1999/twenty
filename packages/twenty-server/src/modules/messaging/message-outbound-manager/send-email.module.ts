import { Module } from '@nestjs/common';

import { FileEmailAttachmentModule } from 'src/engine/core-modules/file/file-email-attachment/file-email-attachment.module';
import { ProductCapabilityModule } from 'src/engine/core-modules/product-capability/product-capability.module';
import { ToolModule } from 'src/engine/core-modules/tool/tool.module';
import { ConnectedAccountMetadataModule } from 'src/engine/metadata-modules/connected-account/connected-account-metadata.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { SendEmailResolver } from 'src/modules/messaging/message-outbound-manager/resolvers/send-email.resolver';
import { MessagingSendManagerModule } from 'src/modules/messaging/message-outbound-manager/messaging-send-manager.module';

@Module({
  imports: [
    FileEmailAttachmentModule,
    ToolModule,
    MessagingSendManagerModule,
    ConnectedAccountMetadataModule,
    PermissionsModule,
    // Provides WorkspaceCapabilityService so CapabilityGuard resolves on the
    // sendEmail resolver.
    ProductCapabilityModule,
  ],
  providers: [SendEmailResolver],
})
export class SendEmailModule {}
