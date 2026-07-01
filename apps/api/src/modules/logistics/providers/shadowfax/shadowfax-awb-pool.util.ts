const AWB_PATTERN = /^(SF)(\d+)([A-Z]*)$/;
const AWB_RANGE_LIMIT = 100_000;

function expandAwbRange(token: string): string[] | null {
  const [startRaw, endRaw, extra] = token.split('-');
  if (!startRaw || !endRaw || extra != null) return null;

  const start = startRaw.match(AWB_PATTERN);
  const end = endRaw.match(AWB_PATTERN);
  if (!start || !end) return null;
  if (start[1] !== end[1] || start[3] !== end[3] || start[2].length !== end[2].length) return null;

  const startNumber = Number(start[2]);
  const endNumber = Number(end[2]);
  if (!Number.isSafeInteger(startNumber) || !Number.isSafeInteger(endNumber) || endNumber < startNumber) {
    return null;
  }
  const count = endNumber - startNumber + 1;
  if (count > AWB_RANGE_LIMIT) return null;

  return Array.from({ length: count }, (_, index) => {
    const numeric = String(startNumber + index).padStart(start[2].length, '0');
    return `${start[1]}${numeric}${start[3]}`;
  });
}

export function parseShadowfaxAwbPool(raw: string | undefined | null): string[] {
  const seen = new Set<string>();
  const awbs: string[] = [];
  const tokens = (raw ?? '')
    .split(/[\s,]+/)
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  for (const token of tokens) {
    const expanded = expandAwbRange(token) ?? (/^SF[A-Z0-9]+$/.test(token) ? [token] : []);
    for (const awb of expanded) {
      if (seen.has(awb)) continue;
      seen.add(awb);
      awbs.push(awb);
    }
  }

  return awbs;
}
