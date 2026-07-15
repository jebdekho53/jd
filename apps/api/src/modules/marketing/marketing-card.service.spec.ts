import { MarketingCardService } from './marketing-card.service';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe('MarketingCardService', () => {
  const svc = new MarketingCardService();

  it('renders a PNG for a franchise partner (all fields, no photo)', async () => {
    const png = await svc.render({
      name: 'Utkarsh Trivedi',
      roleTitle: 'Business Development Partner',
      pillLabel: 'Lucknow Franchise Partner',
      phone: '+91 84708 79036',
      whatsapp: '+91 84708 79036',
      email: 'utkarshpandit4483@gmail.com',
      address: 'Sherwani Nagar Semra Gauri, Behind Deepak Hospital, Sitapur Road, Lucknow, UP',
      qrUrl: 'https://merchant.jebdekho.com/?ref=FR-LKO-01',
      qrCaption: 'Scan to Connect',
    });
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
    expect(png.length).toBeGreaterThan(10_000);
  });

  it('composites a supplied owner photo without throwing', async () => {
    // A tiny valid PNG (1x1) is enough to exercise the resize + rounded-mask path.
    const onePx = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    const png = await svc.render({
      name: 'Sharma General Store',
      roleTitle: 'Store Owner',
      pillLabel: 'JebDekho Store',
      qrUrl: 'https://jebdekho.com/store/sharma-general-store',
      qrCaption: 'Scan to Shop',
      photo: onePx,
    });
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });

  it('degrades to a placeholder when the photo bytes are unreadable', async () => {
    const png = await svc.render({
      name: 'Test Partner',
      roleTitle: 'Partner',
      pillLabel: 'JebDekho',
      qrUrl: 'https://jebdekho.com',
      qrCaption: 'Scan',
      photo: Buffer.from('not an image'),
    });
    expect(png.subarray(0, 4)).toEqual(PNG_MAGIC);
  });
});
