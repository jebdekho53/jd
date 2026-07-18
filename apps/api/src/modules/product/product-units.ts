/**
 * Canonical product units offered to merchants.
 *
 * `unit` on a Product is a free-text string historically, but new input is
 * constrained to this list so the catalogue stays consistent (a buyer sees
 * "500 ml", "1 kg", "6 pieces", not a merchant's ad-hoc spelling).
 *
 * Keep this in sync with the merchant-web copy at
 * apps/merchant-web/features/products/product-units.ts — a units list is stable,
 * so a small duplication beats an extra network round-trip to render a form.
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

export const PRODUCT_UNIT_VALUES: string[] = PRODUCT_UNITS.map((u) => u.value);
