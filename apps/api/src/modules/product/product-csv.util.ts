export const PRODUCT_CSV_HEADERS = [
  'name',
  'brand',
  'category',
  'subcategory',
  'sku',
  'unit',
  'mrp',
  'sellingPrice',
  'stock',
  'description',
  'tags',
  'hsnCode',
  'gstSlab',
  'fssaiLicense',
  'ingredients',
  'shelfLife',
  'countryOfOrigin',
  'manufacturerName',
  'storageInstructions',
  'imageUrl',
  'isActive',
] as const;

export type ProductCsvHeader = (typeof PRODUCT_CSV_HEADERS)[number];

export interface ProductCsvRawRow {
  rowNumber: number;
  values: Record<ProductCsvHeader, string>;
}

const URL_REGEX = /^https?:\/\/.+/i;

export function isValidImageUrl(url: string): boolean {
  if (!url?.trim()) return false;
  if (!URL_REGEX.test(url.trim())) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseProductCsv(content: string): ProductCsvRawRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) return [];

  const headerCols = parseCsvLine(lines[0]).map((h) => h.trim());
  const normalizedHeaders = headerCols.map((h) => h.replace(/^\uFEFF/, '').toLowerCase());
  const hasHeader = normalizedHeaders.includes('name');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const headerMap = hasHeader
    ? normalizedHeaders
    : PRODUCT_CSV_HEADERS.map((h) => h.toLowerCase());

  const rows: ProductCsvRawRow[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    if (line.startsWith('#')) continue;
    const cols = parseCsvLine(line);
    const values = {} as Record<ProductCsvHeader, string>;
    for (let j = 0; j < PRODUCT_CSV_HEADERS.length; j++) {
      const key = PRODUCT_CSV_HEADERS[j];
      const headerIdx = headerMap.indexOf(key.toLowerCase());
      values[key] = headerIdx >= 0 ? (cols[headerIdx] ?? '') : (cols[j] ?? '');
    }
    rows.push({ rowNumber: hasHeader ? i + 2 : i + 1, values });
  }
  return rows;
}

export function buildProductCsvTemplate(): string {
  const instructions = [
    '# JebDekho Product CSV Import Template',
    '# FREE bulk upload — no AI charges apply.',
    '#',
    '# Instructions:',
    '# 1. Fill one row per product. Do not change column headers.',
    '# 2. category/subcategory must match your approved store categories.',
    '# 3. sellingPrice is required. mrp must be >= sellingPrice if provided.',
    '# 4. gstSlab: ZERO | FIVE | TWELVE | EIGHTEEN | TWENTY_EIGHT (or 0,5,12,18,28)',
    '# 5. imageUrl is optional — must be a valid http(s) URL. Leave blank to use placeholder.',
    '# 6. Duplicate SKU or same name+brand+unit will be rejected.',
    '# 7. Lines starting with # are ignored.',
    '#',
  ];

  const examples = [
    [
      'Amul Full Cream Milk',
      'Amul',
      'Dairy',
      'Milk',
      'AMUL-MILK-1L',
      'litre',
      '69',
      '59',
      '50',
      'Fresh full cream milk',
      'dairy,milk',
      '0401',
      'FIVE',
      '',
      'Milk',
      '3 days',
      'India',
      'Amul',
      'Refrigerate at 4°C',
      'https://cdn.example.com/amul-milk.jpg',
      'true',
    ],
    [
      'Aashirvaad Select Atta',
      'Aashirvaad',
      'Grocery',
      'Flour',
      'ATTAA-5KG',
      'kg',
      '280',
      '249',
      '30',
      'Premium whole wheat atta 5kg',
      'atta,flour,grocery',
      '1101',
      'FIVE',
      '',
      'Whole wheat',
      '6 months',
      'India',
      'ITC',
      'Store in cool dry place',
      '',
      'true',
    ],
    [
      'Optimum Nutrition Gold Standard Whey',
      'Optimum Nutrition',
      'Health',
      'Supplements',
      'ON-WHEY-2LB',
      'pack',
      '3499',
      '2999',
      '10',
      'Whey protein isolate 2lb chocolate',
      'protein,fitness,supplement',
      '2106',
      'EIGHTEEN',
      '',
      'Whey protein blend',
      '24 months',
      'USA',
      'Optimum Nutrition',
      'Store in cool dry place',
      'https://cdn.example.com/whey-protein.jpg',
      'true',
    ],
  ];

  return [
    ...instructions,
    PRODUCT_CSV_HEADERS.join(','),
    ...examples.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');
}

export function buildErrorCsv(
  rows: { rowNumber: number; values: Record<string, string>; errors: string[] }[],
): string {
  const headers = ['rowNumber', ...PRODUCT_CSV_HEADERS, 'errors'];
  const lines = [headers.join(',')];
  for (const row of rows) {
    const cols = [
      String(row.rowNumber),
      ...PRODUCT_CSV_HEADERS.map((h) => escapeCsvCell(row.values[h] ?? '')),
      escapeCsvCell(row.errors.join('; ')),
    ];
    lines.push(cols.join(','));
  }
  return lines.join('\n');
}

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
