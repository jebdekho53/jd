import { LegalDocumentCode } from '@prisma/client';
import type { LegalDocument } from './legal-document.types';
import { BUYER_TERMS } from './documents/buyer-terms';
import { MERCHANT_AGREEMENT } from './documents/merchant-agreement';
import { FRANCHISE_AGREEMENT } from './documents/franchise-agreement';
import { RIDER_AGREEMENT } from './documents/rider-agreement';

/**
 * Every legal document the platform serves, keyed by code.
 *
 * This is the single source of truth: portals render from it and acceptances are
 * validated against it, so the words a user sees and the version recorded
 * against them can never drift apart.
 */
export const LEGAL_DOCUMENTS: Readonly<Partial<Record<LegalDocumentCode, LegalDocument>>> =
  Object.freeze({
    [LegalDocumentCode.BUYER_TERMS]: BUYER_TERMS,
    [LegalDocumentCode.MERCHANT_AGREEMENT]: MERCHANT_AGREEMENT,
    [LegalDocumentCode.FRANCHISE_AGREEMENT]: FRANCHISE_AGREEMENT,
    [LegalDocumentCode.RIDER_AGREEMENT]: RIDER_AGREEMENT,
  });

/** Documents a party of each portal must have accepted to transact. */
export const REQUIRED_DOCUMENTS = Object.freeze({
  buyer: [LegalDocumentCode.BUYER_TERMS],
  merchant: [LegalDocumentCode.MERCHANT_AGREEMENT],
  franchise: [LegalDocumentCode.FRANCHISE_AGREEMENT],
  rider: [LegalDocumentCode.RIDER_AGREEMENT],
} satisfies Record<string, LegalDocumentCode[]>);

export type LegalPortal = keyof typeof REQUIRED_DOCUMENTS;

export function getLegalDocument(code: LegalDocumentCode): LegalDocument | undefined {
  return LEGAL_DOCUMENTS[code];
}

export function currentVersion(code: LegalDocumentCode): string | undefined {
  return LEGAL_DOCUMENTS[code]?.version;
}
