/**
 * Minimal RFC-4180 CSV reader + recipient normaliser for WhatsApp broadcasts.
 * Kept dependency-free: the repo has no CSV library and uploads arrive as a
 * JSON string body (see UploadController), not multipart.
 */

export interface ParsedRecipient {
  /** Digits-only international number (no '+'), as Meta expects. */
  waId: string;
  /** The whole CSV row, available for {{column}} interpolation. */
  fields: Record<string, string>;
}

export interface ParsedCsv {
  headers: string[];
  recipients: ParsedRecipient[];
  /** Rows dropped before any send was attempted, with the reason. */
  skipped: Array<{ row: number; raw: string; reason: string }>;
}

/** Splits one CSV line, honouring "quoted, fields" and "" escapes. */
function splitLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

/**
 * Normalise an Indian or international phone number to Meta's digits-only
 * international form. Returns null when it cannot be trusted.
 *
 * Bare 10-digit numbers are assumed Indian (+91) — this is a India-only
 * marketplace — and `00` / `+` prefixes are stripped.
 */
export function normaliseWaId(raw: string, defaultCountryCode = '91'): string | null {
  let digits = (raw ?? '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  digits = digits.replace(/\D/g, '');

  if (digits.length === 10) digits = `${defaultCountryCode}${digits}`;
  // A leading 0 before a 10-digit national number (e.g. 09984412354).
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = `${defaultCountryCode}${digits.slice(1)}`;
  }

  // E.164 allows 8–15 digits including the country code.
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

/**
 * Parse a CSV upload into recipients. The `phone` column is required; every
 * other column becomes an interpolation field. Bad rows are collected in
 * `skipped` rather than aborting the upload, and later duplicates of a number
 * are dropped so nobody is messaged twice.
 */
export function parseRecipientsCsv(csv: string, phoneColumn = 'phone'): ParsedCsv {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) throw new Error('CSV is empty');

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const phoneIndex = headers.indexOf(phoneColumn.toLowerCase());
  if (phoneIndex === -1) {
    throw new Error(`CSV must have a "${phoneColumn}" column. Found: ${headers.join(', ')}`);
  }

  const recipients: ParsedRecipient[] = [];
  const skipped: ParsedCsv['skipped'] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitLine(lines[i]);
    if (cells.length !== headers.length) {
      skipped.push({ row: i + 1, raw: lines[i], reason: `Expected ${headers.length} columns, got ${cells.length}` });
      continue;
    }

    const waId = normaliseWaId(cells[phoneIndex]);
    if (!waId) {
      skipped.push({ row: i + 1, raw: lines[i], reason: 'Unparseable phone number' });
      continue;
    }
    if (seen.has(waId)) {
      skipped.push({ row: i + 1, raw: lines[i], reason: 'Duplicate phone number' });
      continue;
    }
    seen.add(waId);

    const fields: Record<string, string> = {};
    headers.forEach((header, index) => {
      fields[header] = cells[index];
    });
    fields.phone = waId;

    recipients.push({ waId, fields });
  }

  return { headers, recipients, skipped };
}

/**
 * Replace `{{column}}` placeholders with the recipient's field values.
 * Unknown placeholders render as an empty string — a broadcast must never leak
 * a raw `{{name}}` into a customer's chat.
 */
export function renderTemplate(text: string, fields: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => fields[key.toLowerCase()] ?? '');
}
