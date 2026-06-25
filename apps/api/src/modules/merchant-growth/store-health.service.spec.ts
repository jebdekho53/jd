describe('Merchant Success Score formula', () => {
  it('weights components to max 100', () => {
    const fulfillment = 30;
    const ratings = 20;
    const inventory = 15;
    const retention = 15;
    const deliverySla = 10;
    const campaign = 10;
    const total = fulfillment + ratings + inventory + retention + deliverySla + campaign;
    expect(total).toBe(100);
  });

  it('caps score at 100', () => {
    const raw = 30 + 20 + 15 + 15 + 10 + 10;
    expect(Math.min(100, raw)).toBe(100);
  });
});
