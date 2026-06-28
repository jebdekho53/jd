import {
  buildProductCsvTemplate,
  isValidImageUrl,
  parseCsvLine,
  parseProductCsv,
  PRODUCT_CSV_HEADERS,
} from './product-csv.util';

describe('product-csv.util', () => {
  it('builds template with imageUrl and example rows', () => {
    const template = buildProductCsvTemplate();
    expect(template).toContain('# JebDekho Product CSV Import Template');
    expect(template).toContain('imageUrl');
    expect(template).toContain('Amul Full Cream Milk');
    expect(template).toContain('Aashirvaad Select Atta');
    expect(template).toContain('Optimum Nutrition Gold Standard Whey');
    expect(PRODUCT_CSV_HEADERS).toContain('imageUrl');
  });

  it('skips comment lines', () => {
    const csv = `# comment
name,brand,category,subcategory,sku,unit,mrp,sellingPrice,stock,description,tags,hsnCode,gstSlab,fssaiLicense,ingredients,shelfLife,countryOfOrigin,manufacturerName,storageInstructions,imageUrl,isActive
Test,Brand,Dairy,Milk,SKU-1,piece,59,49,10,,,,,,,,,,,,true`;
    const rows = parseProductCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].values.name).toBe('Test');
  });

  it('validates image URLs', () => {
    expect(isValidImageUrl('https://cdn.example.com/img.jpg')).toBe(true);
    expect(isValidImageUrl('not-a-url')).toBe(false);
    expect(isValidImageUrl('')).toBe(false);
  });

  it('parses quoted CSV lines', () => {
    expect(parseCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd']);
  });
});
