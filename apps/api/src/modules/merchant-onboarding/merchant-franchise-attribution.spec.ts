import { FranchisePartnerStatus } from '@prisma/client';
import { MerchantOnboardingService } from './merchant-onboarding.service';

/**
 * Referral attribution on the merchant application: first-touch, and a bad code
 * must never break signup.
 */

const PARTNER = { id: 'fr-1', referralCode: 'FR-NCR-01' };

type Mocks = {
  findFirstApp: jest.Mock;
  updateApp: jest.Mock;
  findFirstPartner: jest.Mock;
};

function buildService(appRow: Record<string, unknown>, partnerRow: unknown = PARTNER) {
  const findFirstApp = jest.fn().mockResolvedValue(appRow);
  const updateApp = jest.fn().mockResolvedValue({});
  const findFirstPartner = jest.fn().mockResolvedValue(partnerRow);

  const prisma = {
    merchantApplication: { findFirst: findFirstApp, update: updateApp },
    franchisePartner: { findFirst: findFirstPartner },
  };

  // The service takes 16 collaborators, none of which the attribution path uses.
  // Build on the prototype and inject only prisma rather than stubbing 15 blanks.
  const svc: MerchantOnboardingService = Object.create(MerchantOnboardingService.prototype);
  Object.assign(svc, { prisma });

  // getOrCreateApplication touches collaborators we haven't stubbed; the attribution
  // path only needs it to resolve.
  (svc as unknown as { getOrCreateApplication: unknown }).getOrCreateApplication = jest
    .fn()
    .mockResolvedValue(appRow);

  return { svc, mocks: { findFirstApp, updateApp, findFirstPartner } satisfies Mocks };
}

const EMPTY_APP = {
  id: 'app-1',
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmContent: null,
  fbclid: null,
  franchiseId: null,
  referralCode: null,
};

describe('setAttribution — franchise referral', () => {
  it('records franchiseId + referralCode from a valid ?ref= code', async () => {
    const { svc, mocks } = buildService(EMPTY_APP);

    const res = await svc.setAttribution('user-1', { ref: 'FR-NCR-01' });

    expect(res).toEqual({ updated: true, franchiseId: 'fr-1' });
    expect(mocks.updateApp.mock.calls[0][0].data).toMatchObject({
      franchiseId: 'fr-1',
      referralCode: 'FR-NCR-01',
    });
  });

  it('only resolves ACTIVE partners, and uppercases the code', async () => {
    const { svc, mocks } = buildService(EMPTY_APP);

    await svc.setAttribution('user-1', { ref: '  fr-ncr-01 ' });

    expect(mocks.findFirstPartner.mock.calls[0][0].where).toEqual({
      referralCode: 'FR-NCR-01',
      status: FranchisePartnerStatus.ACTIVE,
    });
  });

  it('FIRST-TOUCH: a later ref never overwrites the partner already credited', async () => {
    const alreadyAttributed = {
      ...EMPTY_APP,
      franchiseId: 'fr-original',
      referralCode: 'FR-FIRST-01',
    };
    // A second, different partner resolves — but must not win.
    const { svc, mocks } = buildService(alreadyAttributed, {
      id: 'fr-poacher',
      referralCode: 'FR-LATER-99',
    });

    await svc.setAttribution('user-1', { ref: 'FR-LATER-99' });

    expect(mocks.updateApp.mock.calls[0][0].data).toMatchObject({
      franchiseId: 'fr-original',
      referralCode: 'FR-FIRST-01',
    });
  });

  it('an UNKNOWN ref code is a graceful no-op — stores nothing, never throws', async () => {
    const { svc, mocks } = buildService(EMPTY_APP, null); // partner lookup finds nothing

    await expect(svc.setAttribution('user-1', { ref: 'FR-DOES-NOT-EXIST' })).resolves.toEqual({
      updated: true,
      franchiseId: null,
    });

    expect(mocks.updateApp.mock.calls[0][0].data).toMatchObject({
      franchiseId: null,
      referralCode: null,
    });
  });

  it('does not touch the partner table when no ref is supplied', async () => {
    const { svc, mocks } = buildService(EMPTY_APP);

    await svc.setAttribution('user-1', { utmSource: 'facebook' });

    expect(mocks.findFirstPartner).not.toHaveBeenCalled();
    expect(mocks.updateApp.mock.calls[0][0].data).toMatchObject({
      utmSource: 'facebook',
      franchiseId: null,
    });
  });

  it('returns early when the payload carries no attribution at all', async () => {
    const { svc, mocks } = buildService(EMPTY_APP);

    await expect(svc.setAttribution('user-1', {})).resolves.toEqual({ updated: false });
    expect(mocks.updateApp).not.toHaveBeenCalled();
  });
});
