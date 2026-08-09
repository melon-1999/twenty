import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { type ProductCapabilityKey } from 'twenty-shared/types';

import { WorkspaceCapabilityService } from 'src/engine/core-modules/product-capability/services/workspace-capability.service';
import { TypedReflect } from 'src/utils/typed-reflect';

export const CAPABILITY_KEY = 'capability-metadata-args';

export function RequireCapability(capability: ProductCapabilityKey) {
  return (
    target: object,
    _propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    TypedReflect.defineMetadata(
      CAPABILITY_KEY,
      capability,
      descriptor?.value || target,
    );

    return descriptor;
  };
}

@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workspaceCapabilityService: WorkspaceCapabilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const workspaceId = request.workspace?.id;

    if (!workspaceId) {
      return false;
    }

    const capability = this.reflector.get<ProductCapabilityKey>(
      CAPABILITY_KEY,
      context.getHandler(),
    );

    if (!capability) {
      return true;
    }

    const isEnabled = await this.workspaceCapabilityService.isCapabilityEnabled(
      capability,
      workspaceId,
    );

    if (!isEnabled) {
      throw new ForbiddenException(
        `Capability "${capability}" is not enabled for this workspace`,
      );
    }

    return true;
  }
}
