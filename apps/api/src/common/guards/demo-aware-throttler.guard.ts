import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { getConfig } from '../../config/configuration';
import { isDemoAuthRequest } from '../utils/demo-auth.util';

/**
 * Skips HTTP throttling for demo credentials in non-production environments
 * so local testing is not blocked by @Throttle limits on auth routes.
 */
@Injectable()
export class DemoAwareThrottlerGuard extends ThrottlerGuard {
  private readonly cfg: ReturnType<typeof getConfig>;

  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    configService: ConfigService,
  ) {
    super(options, storageService, reflector);
    this.cfg = getConfig(configService);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ body?: { phone?: string; email?: string } }>();
    if (isDemoAuthRequest(request.body, this.cfg)) {
      return true;
    }
    return false;
  }
}
