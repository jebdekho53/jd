import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_STEP_UP_KEY } from '../decorators/require-step-up.decorator';
import { RequestUser } from '../types';

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireStepUp = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_STEP_UP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireStepUp) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      // If the route has RequireStepUp but is public or JwtAuthGuard wasn't applied/valid
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Step-Up Required',
        message: 'Re-authentication required for this sensitive action',
      });
    }

    const authTime = user.authTime; // Unix timestamp in seconds
    if (!authTime) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Step-Up Required',
        message: 'Re-authentication required for this sensitive action',
      });
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const fifteenMinutesInSeconds = 15 * 60;

    if (currentTime - authTime > fifteenMinutesInSeconds) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Step-Up Required',
        message: 'Re-authentication required for this sensitive action',
      });
    }

    return true;
  }
}
