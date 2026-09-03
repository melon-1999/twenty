import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ThrottlerModule } from 'src/engine/core-modules/throttler/throttler.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WebFormConfigModule } from 'src/modules/opportunity/web-form-config.module';
import { WebFormPublicController } from 'src/modules/opportunity/controllers/web-form-public.controller';
import { WebFormSubmissionService } from 'src/modules/opportunity/services/web-form-submission.service';

@Module({
  imports: [
    WebFormConfigModule,
    ThrottlerModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
  ],
  controllers: [WebFormPublicController],
  providers: [WebFormSubmissionService],
})
export class WebFormPublicModule {}
