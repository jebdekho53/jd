import { AttributeDataType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cross-category STARTER attribute taxonomy for AI Catalog v2. Intentionally a
 * useful common core (physical, apparel, electronics, food/nutrition, beauty)
 * — NOT an attempt to enumerate every attribute of every category. New
 * attributes and per-category links are added at runtime via the admin API
 * with no schema migration. Idempotent: safe to re-run.
 *
 * `aiExtractionKey` maps each definition to a key in the AI extractedJson
 * (ExtractedAttributesV2), so the mapping service can normalize approved values.
 */

interface UnitSeed {
  key: string;
  code: string;
  label: string;
  dimension: string;
  baseUnitKey?: string;
  toBaseFactor: number;
  sortOrder: number;
}

// Base units: gram (weight), millilitre (volume), millimetre (length).
const UNITS: UnitSeed[] = [
  { key: 'milligram', code: 'mg', label: 'Milligrams', dimension: 'weight', baseUnitKey: 'gram', toBaseFactor: 0.001, sortOrder: 10 },
  { key: 'gram', code: 'g', label: 'Grams', dimension: 'weight', baseUnitKey: 'gram', toBaseFactor: 1, sortOrder: 20 },
  { key: 'kilogram', code: 'kg', label: 'Kilograms', dimension: 'weight', baseUnitKey: 'gram', toBaseFactor: 1000, sortOrder: 30 },
  { key: 'millilitre', code: 'ml', label: 'Millilitres', dimension: 'volume', baseUnitKey: 'millilitre', toBaseFactor: 1, sortOrder: 40 },
  { key: 'litre', code: 'l', label: 'Litres', dimension: 'volume', baseUnitKey: 'millilitre', toBaseFactor: 1000, sortOrder: 50 },
  { key: 'millimetre', code: 'mm', label: 'Millimetres', dimension: 'length', baseUnitKey: 'millimetre', toBaseFactor: 1, sortOrder: 60 },
  { key: 'centimetre', code: 'cm', label: 'Centimetres', dimension: 'length', baseUnitKey: 'millimetre', toBaseFactor: 10, sortOrder: 70 },
  { key: 'inch', code: 'in', label: 'Inches', dimension: 'length', baseUnitKey: 'millimetre', toBaseFactor: 25.4, sortOrder: 80 },
];

interface GroupSeed {
  key: string;
  name: string;
  sortOrder: number;
}
const GROUPS: GroupSeed[] = [
  { key: 'identity', name: 'Identity & Taxonomy', sortOrder: 10 },
  { key: 'physical', name: 'Physical', sortOrder: 20 },
  { key: 'apparel', name: 'Apparel & Footwear', sortOrder: 30 },
  { key: 'electronics', name: 'Electronics', sortOrder: 40 },
  { key: 'nutrition', name: 'Food & Nutrition', sortOrder: 50 },
  { key: 'beauty', name: 'Beauty & Personal Care', sortOrder: 60 },
];

interface DefSeed {
  key: string;
  name: string;
  group: string;
  dataType: AttributeDataType;
  aiExtractionKey?: string;
  unitDimension?: string;
  defaultUnitKey?: string;
  isFacet?: boolean;
  isFilterable?: boolean;
  isVariantAxis?: boolean;
  options?: { value: string; label: string; colorHex?: string }[];
  sortOrder: number;
}

const COLORS = [
  ['black', 'Black', '#000000'], ['white', 'White', '#FFFFFF'], ['red', 'Red', '#E53935'],
  ['blue', 'Blue', '#1E88E5'], ['green', 'Green', '#43A047'], ['yellow', 'Yellow', '#FDD835'],
  ['orange', 'Orange', '#FB8C00'], ['pink', 'Pink', '#EC407A'], ['purple', 'Purple', '#8E24AA'],
  ['brown', 'Brown', '#6D4C41'], ['grey', 'Grey', '#9E9E9E'], ['gold', 'Gold', '#C9A227'],
  ['silver', 'Silver', '#BDBDBD'], ['beige', 'Beige', '#D7CCC8'], ['multicolor', 'Multicolor'],
].map(([value, label, colorHex]) => ({ value, label, colorHex }));

const DEFS: DefSeed[] = [
  // Identity
  { key: 'brand', name: 'Brand', group: 'identity', dataType: AttributeDataType.TEXT, aiExtractionKey: 'brand', isFacet: true, isFilterable: true, sortOrder: 10 },
  { key: 'variant', name: 'Variant', group: 'identity', dataType: AttributeDataType.TEXT, aiExtractionKey: 'variant', isVariantAxis: true, sortOrder: 20 },
  { key: 'model', name: 'Model', group: 'identity', dataType: AttributeDataType.TEXT, aiExtractionKey: 'model', sortOrder: 30 },
  { key: 'country_of_origin', name: 'Country of Origin', group: 'identity', dataType: AttributeDataType.TEXT, aiExtractionKey: 'countryOfOrigin', isFilterable: true, sortOrder: 40 },
  // Physical
  {
    key: 'color', name: 'Color', group: 'physical', dataType: AttributeDataType.COLOR, aiExtractionKey: 'color',
    isFacet: true, isFilterable: true, isVariantAxis: true, options: COLORS, sortOrder: 10,
  },
  {
    key: 'material', name: 'Material', group: 'physical', dataType: AttributeDataType.ENUM, aiExtractionKey: 'material', isFacet: true, isFilterable: true,
    options: ['cotton', 'polyester', 'leather', 'plastic', 'metal', 'glass', 'wood', 'ceramic', 'silicone', 'stainless_steel', 'rubber', 'paper', 'bamboo']
      .map((v) => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) })),
    sortOrder: 20,
  },
  { key: 'weight', name: 'Weight', group: 'physical', dataType: AttributeDataType.WEIGHT, aiExtractionKey: 'weight', unitDimension: 'weight', defaultUnitKey: 'gram', isFilterable: true, sortOrder: 30 },
  { key: 'volume', name: 'Volume', group: 'physical', dataType: AttributeDataType.VOLUME, aiExtractionKey: 'volume', unitDimension: 'volume', defaultUnitKey: 'millilitre', isFilterable: true, sortOrder: 40 },
  { key: 'dimensions', name: 'Dimensions', group: 'physical', dataType: AttributeDataType.DIMENSION, aiExtractionKey: 'dimensions', unitDimension: 'length', defaultUnitKey: 'centimetre', sortOrder: 50 },
  { key: 'pack_size', name: 'Pack Size', group: 'physical', dataType: AttributeDataType.TEXT, aiExtractionKey: 'packSize', isFilterable: true, sortOrder: 60 },
  { key: 'package_type', name: 'Package Type', group: 'physical', dataType: AttributeDataType.TEXT, aiExtractionKey: 'packageType', sortOrder: 70 },
  { key: 'shape', name: 'Shape', group: 'physical', dataType: AttributeDataType.TEXT, aiExtractionKey: 'shape', sortOrder: 80 },
  { key: 'pattern', name: 'Pattern', group: 'physical', dataType: AttributeDataType.TEXT, aiExtractionKey: 'pattern', sortOrder: 90 },
  { key: 'finish', name: 'Finish', group: 'physical', dataType: AttributeDataType.TEXT, aiExtractionKey: 'finish', sortOrder: 100 },
  // Apparel
  {
    key: 'gender', name: 'Gender', group: 'apparel', dataType: AttributeDataType.ENUM, aiExtractionKey: 'gender', isFacet: true, isFilterable: true,
    options: ['men', 'women', 'unisex', 'boys', 'girls', 'baby'].map((v) => ({ value: v, label: v.replace(/\b\w/g, (c) => c.toUpperCase()) })),
    sortOrder: 10,
  },
  { key: 'age_group', name: 'Age Group', group: 'apparel', dataType: AttributeDataType.TEXT, aiExtractionKey: 'ageGroup', isFilterable: true, sortOrder: 20 },
  // Nutrition
  { key: 'flavor', name: 'Flavor', group: 'nutrition', dataType: AttributeDataType.TEXT, aiExtractionKey: 'flavor', isFacet: true, isFilterable: true, isVariantAxis: true, sortOrder: 10 },
  { key: 'ingredients', name: 'Ingredients', group: 'nutrition', dataType: AttributeDataType.TEXT, aiExtractionKey: 'ingredients', sortOrder: 20 },
  { key: 'shelf_life', name: 'Shelf Life', group: 'nutrition', dataType: AttributeDataType.TEXT, aiExtractionKey: 'shelfLife', sortOrder: 30 },
  { key: 'expiry_date', name: 'Expiry Date', group: 'nutrition', dataType: AttributeDataType.DATE, aiExtractionKey: 'expiryDate', sortOrder: 40 },
  // Marketing / general
  {
    key: 'certifications', name: 'Certifications', group: 'identity', dataType: AttributeDataType.MULTI_SELECT, aiExtractionKey: 'certifications', isFacet: true, isFilterable: true,
    options: ['fssai', 'iso', 'ce', 'bis', 'organic', 'vegan', 'cruelty_free', 'gluten_free', 'gmp']
      .map((v) => ({ value: v, label: v.replace(/_/g, ' ').toUpperCase() })),
    sortOrder: 50,
  },
];

async function main(): Promise<void> {
  for (const u of UNITS) {
    await prisma.unitDefinition.upsert({
      where: { key: u.key },
      create: { key: u.key, code: u.code, label: u.label, dimension: u.dimension, baseUnitKey: u.baseUnitKey, toBaseFactor: u.toBaseFactor, sortOrder: u.sortOrder },
      update: { code: u.code, label: u.label, dimension: u.dimension, baseUnitKey: u.baseUnitKey, toBaseFactor: u.toBaseFactor, sortOrder: u.sortOrder },
    });
  }

  const groupIdByKey = new Map<string, string>();
  for (const g of GROUPS) {
    const row = await prisma.attributeGroup.upsert({
      where: { key: g.key },
      create: { key: g.key, name: g.name, sortOrder: g.sortOrder },
      update: { name: g.name, sortOrder: g.sortOrder },
    });
    groupIdByKey.set(g.key, row.id);
  }

  const unitIdByKey = new Map((await prisma.unitDefinition.findMany()).map((u) => [u.key, u.id]));

  for (const d of DEFS) {
    const def = await prisma.attributeDefinition.upsert({
      where: { key: d.key },
      create: {
        key: d.key,
        name: d.name,
        groupId: groupIdByKey.get(d.group),
        dataType: d.dataType,
        aiExtractionKey: d.aiExtractionKey,
        unitDimension: d.unitDimension,
        defaultUnitId: d.defaultUnitKey ? unitIdByKey.get(d.defaultUnitKey) : undefined,
        isFacet: d.isFacet ?? false,
        isFilterable: d.isFilterable ?? false,
        isVariantAxis: d.isVariantAxis ?? false,
        sortOrder: d.sortOrder,
      },
      update: {
        name: d.name,
        groupId: groupIdByKey.get(d.group),
        dataType: d.dataType,
        aiExtractionKey: d.aiExtractionKey,
        unitDimension: d.unitDimension,
        defaultUnitId: d.defaultUnitKey ? unitIdByKey.get(d.defaultUnitKey) : undefined,
        isFacet: d.isFacet ?? false,
        isFilterable: d.isFilterable ?? false,
        isVariantAxis: d.isVariantAxis ?? false,
        sortOrder: d.sortOrder,
      },
    });

    for (const [i, opt] of (d.options ?? []).entries()) {
      await prisma.attributeOption.upsert({
        where: { definitionId_value: { definitionId: def.id, value: opt.value } },
        create: { definitionId: def.id, value: opt.value, label: opt.label, colorHex: opt.colorHex, sortOrder: i * 10 },
        update: { label: opt.label, colorHex: opt.colorHex, sortOrder: i * 10 },
      });
    }
  }

  const [units, groups, defs, options] = await Promise.all([
    prisma.unitDefinition.count(),
    prisma.attributeGroup.count(),
    prisma.attributeDefinition.count(),
    prisma.attributeOption.count(),
  ]);
  // eslint-disable-next-line no-console
  console.log(`AI catalog attribute seed complete: ${units} units, ${groups} groups, ${defs} definitions, ${options} options`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
