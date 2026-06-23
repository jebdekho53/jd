import { SetMetadata } from '@nestjs/common';
import { AUDIT_ACTION_KEY } from '../constants';

/**
 * Attach an audit action label to a controller method.
 * The AuditInterceptor picks this up and writes to audit_logs.
 *
 * Example: @AuditAction('STORE_APPROVED')
 */
export const AuditAction = (action: string) => SetMetadata(AUDIT_ACTION_KEY, action);
