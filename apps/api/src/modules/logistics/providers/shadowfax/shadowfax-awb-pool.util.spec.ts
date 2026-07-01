import { parseShadowfaxAwbPool } from './shadowfax-awb-pool.util';

describe('parseShadowfaxAwbPool', () => {
  it('parses comma and whitespace separated AWBs', () => {
    expect(parseShadowfaxAwbPool('SF10000001JEB, SF10000002JEB\nSF10000002JEB')).toEqual([
      'SF10000001JEB',
      'SF10000002JEB',
    ]);
  });

  it('expands contiguous Shadowfax AWB ranges', () => {
    expect(parseShadowfaxAwbPool('SF10009999JEB-SF10010000JEB')).toEqual([
      'SF10009999JEB',
      'SF10010000JEB',
    ]);
  });

  it('supports the JebDekho issued block without listing every AWB in env', () => {
    const awbs = parseShadowfaxAwbPool('SF10000001JEB-SF10010000JEB');

    expect(awbs).toHaveLength(10_000);
    expect(awbs[0]).toBe('SF10000001JEB');
    expect(awbs[awbs.length - 1]).toBe('SF10010000JEB');
  });

  it('supports reverse AWB ranges when R prefix is explicitly allowed', () => {
    const awbs = parseShadowfaxAwbPool('R10000001JEB-R10010000JEB', ['R']);

    expect(awbs).toHaveLength(10_000);
    expect(awbs[0]).toBe('R10000001JEB');
    expect(awbs[awbs.length - 1]).toBe('R10010000JEB');
  });

  it('does not mix reverse AWBs into the forward SF pool by default', () => {
    expect(parseShadowfaxAwbPool('R10000001JEB-R10010000JEB')).toEqual([]);
  });

  it('ignores invalid or mismatched ranges', () => {
    expect(parseShadowfaxAwbPool('SF10000002JEB-SF10000001JEB SF1ABC-SF02ABC bad')).toEqual([]);
  });
});
