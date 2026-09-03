import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Request } from 'express';
import { ApiPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { ThrottlerService } from 'src/engine/core-modules/throttler/throttler.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { WebFormConfigService } from 'src/modules/opportunity/services/web-form-config.service';
import { WebFormSubmissionService } from 'src/modules/opportunity/services/web-form-submission.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Controller(ApiPath.WebForms)
export class WebFormPublicController {
  constructor(
    private readonly webFormConfigService: WebFormConfigService,
    private readonly webFormSubmissionService: WebFormSubmissionService,
    private readonly throttlerService: ThrottlerService,
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  @Get(':workspaceId/:formId')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async getForm(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
  ) {
    const form = await this.resolveEnabledForm(workspaceId, formId);

    return {
      title: form.title,
      description: form.description,
      thankYouText: form.thankYouText,
    };
  }

  @Post(':workspaceId/:formId/submit')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async submitForm(
    @Param('workspaceId') workspaceId: string,
    @Param('formId') formId: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      _hp?: string;
    },
    @Req() request: Request,
  ) {
    if (isDefined(body._hp) && body._hp.trim() !== '') {
      return { ok: true };
    }

    await this.throttlerService.tokenBucketThrottleOrThrow(
      `web-form-submit:${request.ip}`,
      1,
      5,
      60_000,
    );

    const email = (body.email ?? '').trim();

    if (!EMAIL_REGEX.test(email)) {
      throw new BadRequestException('A valid email is required');
    }

    const form = await this.resolveEnabledForm(workspaceId, formId);

    await this.webFormSubmissionService.submit({
      workspaceId,
      form,
      input: {
        firstName: (body.firstName ?? '').trim(),
        lastName: (body.lastName ?? '').trim(),
        email,
        phone: (body.phone ?? '').trim(),
        jobTitle: (body.jobTitle ?? '').trim(),
      },
    });

    return { ok: true };
  }

  private async resolveEnabledForm(workspaceId: string, formId: string) {
    const workspaceExists = await this.workspaceRepository.existsBy({
      id: workspaceId,
    });

    if (!workspaceExists) {
      throw new NotFoundException('Form not found');
    }

    const { forms } = await this.webFormConfigService.getWebForms(workspaceId);
    const form = forms.find((candidate) => candidate.id === formId);

    if (!isDefined(form) || form.enabled === false) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }
}
