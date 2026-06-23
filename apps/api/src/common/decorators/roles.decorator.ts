import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants';

/**
 * Restrict an endpoint to one or more roles (OR logic).
 * Example: @Roles('ADMIN', 'SUPER_ADMIN')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
