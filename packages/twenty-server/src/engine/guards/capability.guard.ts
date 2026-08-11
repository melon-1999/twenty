import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

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

  canActivate(context: ExecutionContext): boolean {
    const capability = this.reflector.get<ProductCapabilityKey>(
      CAPABILITY_KEY,
      context.getHandler(),
    );

    if (!capability) {
      return true;
    }

    // Availability is deployment-scoped (config-driven), not workspace-scoped.
    if (!this.workspaceCapabilityService.isCapabilityAvailable(capability)) {
      throw new ForbiddenException(
        `Module "${capability}" is not available on this deployment`,
      );
    }

    return true;
  }
}
