import { PublicPromotionController } from './public-promotion.controller';
import { BuyerPromotionController } from './buyer-promotion.controller';

describe('Promotion IDOR guards', () => {
  it('PublicPromotionController does not expose personalized offers endpoint', () => {
    const methodNames = Object.getOwnPropertyNames(PublicPromotionController.prototype);
    expect(methodNames).not.toContain('recommended');
  });

  it('BuyerPromotionController exposes authenticated recommended offers', () => {
    const methodNames = Object.getOwnPropertyNames(BuyerPromotionController.prototype);
    expect(methodNames).toContain('recommended');
  });
});
