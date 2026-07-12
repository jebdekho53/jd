import { normaliseWaId, parseRecipientsCsv, renderTemplate } from './csv-recipients.util';

describe('normaliseWaId', () => {
  it('accepts the formats a spreadsheet actually contains', () => {
    expect(normaliseWaId('+91 99844 12354')).toBe('919984412354');
    expect(normaliseWaId('9984412354')).toBe('919984412354');
    expect(normaliseWaId('09984412354')).toBe('919984412354');
    expect(normaliseWaId('0091-9984412354')).toBe('919984412354');
    expect(normaliseWaId('+1 (555) 010-2030')).toBe('15550102030');
  });

  it('rejects numbers that are too short or too long', () => {
    expect(normaliseWaId('12345')).toBeNull();
    expect(normaliseWaId('9199844123549984412354')).toBeNull();
    expect(normaliseWaId('')).toBeNull();
  });
});

describe('parseRecipientsCsv', () => {
  it('parses rows, exposes every column, and normalises the phone', () => {
    const { headers, recipients, skipped } = parseRecipientsCsv(
      'phone,name,city\n+919984412354,Rahul,Muradnagar\n9876543210,Priya,Delhi',
    );

    expect(headers).toEqual(['phone', 'name', 'city']);
    expect(skipped).toEqual([]);
    expect(recipients).toEqual([
      { waId: '919984412354', fields: { phone: '919984412354', name: 'Rahul', city: 'Muradnagar' } },
      { waId: '919876543210', fields: { phone: '919876543210', name: 'Priya', city: 'Delhi' } },
    ]);
  });

  it('honours quoted fields containing commas', () => {
    const { recipients } = parseRecipientsCsv('phone,name\n9984412354,"Seth, Rahul"');
    expect(recipients[0].fields.name).toBe('Seth, Rahul');
  });

  it('skips bad rows and duplicates instead of aborting the upload', () => {
    const { recipients, skipped } = parseRecipientsCsv(
      ['phone,name', '9984412354,Rahul', 'not-a-number,Ghost', '+919984412354,Duplicate', '9876543210'].join('\n'),
    );

    expect(recipients.map((r) => r.waId)).toEqual(['919984412354']);
    expect(skipped.map((s) => s.reason)).toEqual([
      'Unparseable phone number',
      'Duplicate phone number',
      'Expected 2 columns, got 1',
    ]);
  });

  it('rejects a CSV with no phone column', () => {
    expect(() => parseRecipientsCsv('name,city\nRahul,Delhi')).toThrow(/must have a "phone" column/);
  });
});

describe('renderTemplate', () => {
  it('interpolates fields case-insensitively', () => {
    expect(renderTemplate('Hi {{name}} from {{City}}!', { name: 'Rahul', city: 'Delhi' })).toBe(
      'Hi Rahul from Delhi!',
    );
  });

  it('never leaks a raw placeholder for an unknown field', () => {
    expect(renderTemplate('Hi {{nickname}}!', { name: 'Rahul' })).toBe('Hi !');
  });
});
