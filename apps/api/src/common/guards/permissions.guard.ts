import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../constants';
import { RequestUser, AuthenticatedRequest } from '../types';

/**
 * Checks that the authenticated user holds ALL required permissions (AND logic).
 * If no @Permissions() decorator is present, the guard passes.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: RequestUser = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const missingPermissions = requiredPermissions.filter(
      (perm) => !user.permissions.includes(perm),
    );

    if (missingPermissions.length > 0) {
      throw new ForbiddenException({
        message: 'Insufficient permissions',
        error: 'Forbidden',
        missingPermissions,
      });
    }

    return true;
  }
}
