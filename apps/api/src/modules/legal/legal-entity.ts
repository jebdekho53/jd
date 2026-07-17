/**
 * The single source of truth for who JebDekho legally is.
 *
 * "JebDekho" is a trade name only. Every agreement, notice and invoice must name
 * the company — UrbanMove Services Private Limited — as the contracting party,
 * with the trade name introduced once and used thereafter.
 *
 * The statutory identifiers below are mandatory disclosures under the Companies
 * Act 2013, the Consumer Protection (E-Commerce) Rules 2020 and the IT Rules
 * 2021. They must be the company's real, verifiable values — never invented.
 * `assertLegalEntityComplete()` guards that nothing ships while still a
 * placeholder.
 */

/** Marks a value the company must supply. Anything still holding one is unpublishable. */
export const PENDING = '<<PENDING>>' as const;

export const LEGAL_ENTITY = {
  /** Registered company name — the contracting party in every agreement. */
  legalName: 'UrbanMove Services Private Limited',
  /** Brand/trade name the platform operates under. */
  tradeName: 'JebDekho',
  /** Corporate Identity Number — Companies Act 2013 s.12(3)(c). */
  cin: PENDING as string,
  /** GST identification number. */
  gstin: PENDING as string,
  /** Registered office as filed with the RoC. */
  registeredOffice: {
    line1: PENDING as string,
    city: PENDING as string,
    state: PENDING as string,
    pincode: PENDING as string,
    country: 'India',
  },
  /**
   * Grievance Officer — mandatory under the Consumer Protection (E-Commerce)
   * Rules 2020 r.4(5) and the IT Rules 2021 r.3(2). Name, contact and address
   * must be published, and complaints acknowledged within 48 hours.
   */
  grievanceOfficer: {
    name: PENDING as string,
    email: PENDING as string,
    phone: PENDING as string,
  },
  /** Courts with exclusive jurisdiction — the registered office's city. */
  jurisdictionCity: PENDING as string,
  contact: {
    support: 'support@jebdekho.com',
    merchant: 'merchant@jebdekho.com',
    partners: 'partners@jebdekho.com',
    business: 'business@jebdekho.com',
  },
  website: 'https://jebdekho.com',
} as const;

/** Registered office as a single line, for document headers and signature blocks. */
export function registeredOfficeLine(): string {
  const o = LEGAL_ENTITY.registeredOffice;
  return `${o.line1}, ${o.city}, ${o.state} ${o.pincode}, ${o.country}`;
}

/** How the company is introduced the first time a document names it. */
export function partyIntroduction(): string {
  return (
    `${LEGAL_ENTITY.legalName}, a company incorporated under the Companies Act, 2013 ` +
    `(CIN: ${LEGAL_ENTITY.cin}), having its registered office at ${registeredOfficeLine()}, ` +
    `operating the "${LEGAL_ENTITY.tradeName}" platform`
  );
}

/** Every field that is still a placeholder, as dotted paths. */
export function pendingLegalFields(): string[] {
  const pending: string[] = [];
  const walk = (value: unknown, path: string): void => {
    if (value === PENDING) {
      pending.push(path);
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key);
    }
  };
  walk(LEGAL_ENTITY, '');
  return pending;
}

/**
 * Refuse to serve legal documents that still contain placeholders.
 *
 * A document naming a fake CIN or an unnamed grievance officer is worse than no
 * document: it is a false statutory disclosure that users would be asked to
 * accept. Failing loudly is the point.
 */
export function assertLegalEntityComplete(): void {
  const pending = pendingLegalFields();
  if (pending.length > 0) {
    throw new Error(
      `Legal entity details are incomplete — cannot serve legal documents. ` +
        `Fill these in legal-entity.ts: ${pending.join(', ')}`,
    );
  }
}
