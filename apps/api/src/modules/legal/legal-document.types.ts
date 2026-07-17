import { LegalDocumentCode } from '@prisma/client';

/**
 * A clause block. `body` paragraphs render as prose; `list` items render as a
 * bulleted list. Portals style these themselves — the API owns the words, not
 * the look.
 */
export interface LegalSection {
  heading: string;
  body?: string[];
  list?: string[];
}

export interface LegalDocument {
  code: LegalDocumentCode;
  title: string;
  /**
   * Bump whenever the words change in a way a party would care about. The
   * version is recorded against every acceptance, so it is the only thing that
   * proves what someone actually agreed to — never edit a published version's
   * text in place, publish a new version instead.
   */
  version: string;
  /** ISO date the version takes effect. */
  effectiveDate: string;
  /** One-line summary rendered next to the acceptance tick. */
  summary: string;
  sections: LegalSection[];
}

/** Serialisable shape returned to portals. */
export type LegalDocumentPayload = LegalDocument;
