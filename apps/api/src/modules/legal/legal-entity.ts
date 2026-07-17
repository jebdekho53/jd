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
  cin: 'U49224UP2025PTC229800' as string,
  /** GST identification number. Stored uppercase — the GSTIN is a canonical identifier. */
  gstin: '09AADCU9117A1ZH' as string,
  /** Registered office as filed with the RoC. */
  registeredOffice: {
    line1: 'C/o Rajesh Kumar Seth, Gung Gali, Mariahun Bazar' as string,
    /** Mariahu is the tehsil, Jaunpur the district — both are part of the address. */
    city: 'Mariahu, Jaunpur' as string,
    state: 'Uttar Pradesh' as string,
    pincode: '222161' as string,
    country: 'India',
  },
  /**
   * Grievance Officer — mandatory under the Consumer Protection (E-Commerce)
   * Rules 2020 r.4(5) and the IT Rules 2021 r.3(2). Name, contact and address
   * must be published, and complaints acknowledged within 48 hours.
   */
  grievanceOfficer: {
    name: 'Rahul Seth' as string,
    email: 'support@jebdekho.com' as string,
    phone: '+91 83760 27897' as string,
  },
  /**
   * Courts with exclusive jurisdiction — the registered office's seat.
   * Mariahu is a tehsil of Jaunpur district, so the district courts are at Jaunpur.
   */
  jurisdictionCity: 'Jaunpur, Uttar Pradesh' as string,
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

/** CIN: U/L + 5-digit industry code + 2-letter state + 4-digit year + type + 6-digit number. */
export const CIN_PATTERN = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
/** GSTIN: 2-digit state code + 10-char PAN + entity code + 'Z' + checksum. */
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][0-9A-Z]$/;

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
