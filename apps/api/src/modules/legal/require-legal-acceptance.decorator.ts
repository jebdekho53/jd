import { SetMetadata } from '@nestjs/common';
import { LegalDocumentCode } from '@prisma/client';

/** Reflector key carrying the document a route requires acceptance of. */
export const LEGAL_ACCEPTANCE_KEY = 'legal:acceptance';

/**
 * Require the authenticated caller to have accepted the CURRENT version of a
 * legal document before the route runs. Enforced by {@link LegalAcceptanceGuard}.
 *
 * This is the real enforcement — the portal's re-accept modal is only a prompt.
 * A caller who never accepted, or who accepted an older version, is rejected
 * with a machine-readable 403 the client can turn into an accept prompt.
 *
 * Example: `@RequireLegalAcceptance(LegalDocumentCode.BUYER_TERMS)`
 */
export const RequireLegalAcceptance = (code: LegalDocumentCode) =>
  SetMetadata(LEGAL_ACCEPTANCE_KEY, code);
