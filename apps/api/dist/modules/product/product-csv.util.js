"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCT_CSV_HEADERS = void 0;
exports.isValidImageUrl = isValidImageUrl;
exports.parseCsvLine = parseCsvLine;
exports.parseProductCsv = parseProductCsv;
exports.buildProductCsvTemplate = buildProductCsvTemplate;
exports.buildErrorCsv = buildErrorCsv;
exports.PRODUCT_CSV_HEADERS = [
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
];
const URL_REGEX = /^https?:\/\/.+/i;
function isValidImageUrl(url) {
    if (!url?.trim())
        return false;
    if (!URL_REGEX.test(url.trim()))
        return false;
    try {
        const parsed = new URL(url.trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
}
function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        }
        else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}
function parseProductCsv(content) {
    const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('#'));
    if (lines.length === 0)
        return [];
    const headerCols = parseCsvLine(lines[0]).map((h) => h.trim());
    const normalizedHeaders = headerCols.map((h) => h.replace(/^\uFEFF/, '').toLowerCase());
    const hasHeader = normalizedHeaders.includes('name');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const headerMap = hasHeader
        ? normalizedHeaders
        : exports.PRODUCT_CSV_HEADERS.map((h) => h.toLowerCase());
    const rows = [];
    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        if (line.startsWith('#'))
            continue;
        const cols = parseCsvLine(line);
        const values = {};
        for (let j = 0; j < exports.PRODUCT_CSV_HEADERS.length; j++) {
            const key = exports.PRODUCT_CSV_HEADERS[j];
            const headerIdx = headerMap.indexOf(key.toLowerCase());
            values[key] = headerIdx >= 0 ? (cols[headerIdx] ?? '') : (cols[j] ?? '');
        }
        rows.push({ rowNumber: hasHeader ? i + 2 : i + 1, values });
    }
    return rows;
}
function buildProductCsvTemplate() {
    const instructions = [
        '# JebDekho Product CSV Import Template',
        '# FREE bulk upload — no AI charges apply.',
        '#',
        '# Instructions:',
        '# 1. Fill one row per product. Do not change column headers.',
        '# 2. category/subcategory must match your approved store categories.',
        '# 3. sellingPrice is required. mrp must be >= sellingPrice if provided.',
        '# 4. hsnCode is required — use an active numeric 4, 6, or 8 digit HSN code.',
        '# 5. gstSlab: ZERO | FIVE | TWELVE | EIGHTEEN | TWENTY_EIGHT (or 0,5,12,18,28)',
        '# 6. imageUrl is optional — must be a valid http(s) URL. Leave blank to use placeholder.',
        '# 7. Duplicate SKU or same name+brand+unit will be rejected.',
        '# 8. Lines starting with # are ignored.',
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
        exports.PRODUCT_CSV_HEADERS.join(','),
        ...examples.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\n');
}
function buildErrorCsv(rows) {
    const headers = ['rowNumber', ...exports.PRODUCT_CSV_HEADERS, 'errors'];
    const lines = [headers.join(',')];
    for (const row of rows) {
        const cols = [
            String(row.rowNumber),
            ...exports.PRODUCT_CSV_HEADERS.map((h) => escapeCsvCell(row.values[h] ?? '')),
            escapeCsvCell(row.errors.join('; ')),
        ];
        lines.push(cols.join(','));
    }
    return lines.join('\n');
}
function escapeCsvCell(value) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
//# sourceMappingURL=product-csv.util.js.map