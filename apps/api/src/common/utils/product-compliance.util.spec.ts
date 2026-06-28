import {
  isFssaiRequiredCategory,
  isHsnRequiredCategory,
} from './product-compliance.util';

describe('product-compliance.util', () => {
  it('requires HSN for grocery subcategories', () => {
    expect(isHsnRequiredCategory({ slug: 'dairy-bakery', name: 'Dairy & Bakery' })).toBe(true);
    expect(isHsnRequiredCategory({ slug: 'fruits-vegetables', name: 'Fruits & Vegetables' })).toBe(
      true,
    );
  });

  it('does not require HSN for supplements', () => {
    expect(isHsnRequiredCategory({ slug: 'supplements', name: 'Supplements' })).toBe(false);
  });

  it('requires FSSAI only for food/grocery categories', () => {
    expect(isFssaiRequiredCategory({ slug: 'grocery', name: 'Grocery' })).toBe(true);
    expect(isFssaiRequiredCategory({ slug: 'dairy-bakery', name: 'Dairy & Bakery' })).toBe(true);
  });

  it('excludes FSSAI for supplements and health nutrition', () => {
    expect(isFssaiRequiredCategory({ slug: 'supplements', name: 'Supplements' })).toBe(false);
    expect(isFssaiRequiredCategory({ slug: 'health-nutrition', name: 'Health & Nutrition' })).toBe(
      false,
    );
    expect(isFssaiRequiredCategory({ slug: 'personal-care', name: 'Personal Care' })).toBe(false);
  });
});
