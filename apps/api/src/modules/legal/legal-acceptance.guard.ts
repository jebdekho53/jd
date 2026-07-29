import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LegalDocumentCode } from '@prisma/client';
import { AuthenticatedRequest, RequestUser } from '../../common/types';
import { LegalService } from './legal.service';
import { currentVersion } from './legal-documents.registry';
import { LEGAL_ACCEPTANCE_KEY } from './require-legal-acceptance.decorator';

/**
 * Blocks a route until the authenticated caller has accepted the CURRENT version
 * of the document named by `@RequireLegalAcceptance()`. Routes without the
 * decorator pass through untouched.
 *
 * MUST run after JwtAuthGuard (which populates `request.user`). On every guarded
 * controller it is listed last in `@UseGuards(...)`, and NestJS runs guards in
 * declaration order, so `request.user` is always present by the time this runs.
 *
 * `LegalService.hasAccepted` checks the current version, so a caller who only
 * ever accepted an older version (v0 after a v1 bump) is rejected exactly like
 * one who never accepted — which is what drives re-acceptance.
 */
@Injectable()
export class LegalAcceptanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly legal: LegalService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const code = this.reflector.getAllAndOverride<LegalDocumentCode | undefined>(
      LEGAL_ACCEPTANCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!code) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: RequestUser | undefined = request.user;
    if (!user) {
      // Should never happen — JwtAuthGuard runs first — but never fail open.
      throw new ForbiddenException('Authentication required');
    }

    const accepted = await this.legal.hasAccepted(user.id, code);
    if (!accepted) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'LEGAL_ACCEPTANCE_REQUIRED',
        message: 'You must accept the current agreement to continue.',
        code,
        version: currentVersion(code) ?? null,
      });
    }

    return true;
  }
}
