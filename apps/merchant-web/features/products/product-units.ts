/**
 * Canonical product units for the add/edit-product dropdown.
 *
 * Mirror of apps/api/src/modules/product/product-units.ts (the API validates the
 * submitted `unit` against the same list). Keep the two in sync.
 */
export const PRODUCT_UNITS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'piece', label: 'Piece' },
  { value: 'pack', label: 'Pack' },
  { value: 'packet', label: 'Packet' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'l', label: 'Litre (L)' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'jar', label: 'Jar' },
  { value: 'box', label: 'Box' },
  { value: 'container', label: 'Container' },
  { value: 'can', label: 'Can' },
  { value: 'sachet', label: 'Sachet' },
  { value: 'tray', label: 'Tray' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'combo', label: 'Combo' },
];

const UNIT_ALIASES: Record<string, string> = {
  grams: 'g', gram: 'g', gm: 'g', gms: 'g',
  kilogram: 'kg', kilograms: 'kg', kgs: 'kg',
  litre: 'l', liter: 'l', litres: 'l', liters: 'l', ltr: 'l',
  millilitre: 'ml', milliliter: 'ml', millilitres: 'ml',
  pcs: 'piece', pc: 'piece', pieces: 'piece', unit: 'piece', nos: 'piece', no: 'piece',
};

const UNIT_VALUES = new Set(PRODUCT_UNITS.map((u) => u.value));

/**
 * Snap any stored/OCR unit to a canonical dropdown value so the select always
 * shows a valid option and the API's unit validation never rejects an edit of a
 * legacy product. Unknown units fall back to "piece".
 */
export function normalizeUnit(raw?: string | null): string {
  const v = (raw ?? '').toLowerCase().trim();
  if (UNIT_VALUES.has(v)) return v;
  return UNIT_ALIASES[v] ?? 'piece';
}
