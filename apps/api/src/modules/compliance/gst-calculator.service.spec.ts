import { isValidGstin, gstinStateCode, normalizeGstin } from './gst-validation.util';
import { GstCalculatorService } from './gst-calculator.service';
import { GstSlab, GstSupplyType } from '@prisma/client';

describe('gst-validation', () => {
  it('validates correct GSTIN', () => {
    expect(isValidGstin('07AAGCR2206E1ZN')).toBe(true);
    expect(gstinStateCode('07AAGCR2206E1ZN')).toBe('07');
    expect(normalizeGstin('07aagcr2206e1zn')).toBe('07AAGCR2206E1ZN');
  });

  it('rejects invalid GSTIN', () => {
    expect(isValidGstin('INVALID')).toBe(false);
    expect(gstinStateCode(null)).toBeNull();
  });
});

describe('GstCalculatorService', () => {
  const calc = new GstCalculatorService({} as never);

  it('splits CGST/SGST for intra-state', () => {
    const line = calc.computeLine(
      { quantity: 2, unitPrice: 100, gstSlab: GstSlab.EIGHTEEN },
      GstSupplyType.INTRA_STATE,
      { cgstRate: 9, sgstRate: 9, igstRate: 18 },
    );
    expect(line.taxableAmount).toBe(200);
    expect(line.cgstAmount).toBe(18);
    expect(line.sgstAmount).toBe(18);
    expect(line.igstAmount).toBe(0);
    expect(line.lineTotal).toBe(236);
  });

  it('applies IGST for inter-state', () => {
    const line = calc.computeLine(
      { quantity: 1, unitPrice: 100, gstSlab: GstSlab.EIGHTEEN },
      GstSupplyType.INTER_STATE,
      { cgstRate: 9, sgstRate: 9, igstRate: 18 },
    );
    expect(line.igstAmount).toBe(18);
    expect(line.cgstAmount).toBe(0);
    expect(line.sgstAmount).toBe(0);
  });

  it('handles tax-inclusive pricing', () => {
    const line = calc.computeLine(
      { quantity: 1, unitPrice: 118, gstSlab: GstSlab.EIGHTEEN, taxInclusive: true },
      GstSupplyType.INTRA_STATE,
      { cgstRate: 9, sgstRate: 9, igstRate: 18 },
    );
    expect(line.taxableAmount).toBe(100);
    expect(line.lineTotal).toBe(118);
  });
});
