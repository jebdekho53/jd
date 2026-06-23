import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants';

/**
 * Restrict an endpoint to users who hold ALL listed permissions (AND logic).
 * Example: @Permissions('products:write')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
