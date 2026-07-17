import { LegalDocumentCode } from '@prisma/client';
import type { LegalDocument } from '../legal-document.types';
import { LEGAL_ENTITY, partyIntroduction, registeredOfficeLine } from '../legal-entity';

const E = LEGAL_ENTITY;

/**
 * Customer-facing terms of service.
 *
 * Written to be read by an ordinary customer, so the language stays plain and
 * the clauses that cost people money — cancellation, refunds, COD — say plainly
 * what happens. The statutory disclosures required by the Consumer Protection
 * (E-Commerce) Rules 2020 (legal name, registered address, grievance officer)
 * are in clause 1 and clause 14, not buried.
 */
export const BUYER_TERMS: LegalDocument = {
  code: LegalDocumentCode.BUYER_TERMS,
  title: 'Terms of Service',
  version: 'v1',
  effectiveDate: '2026-07-17',
  summary: `I agree to the ${E.tradeName} Terms of Service and Privacy Policy.`,
  sections: [
    {
      heading: '1. Who you are dealing with',
      body: [
        `${E.tradeName} is a hyperlocal marketplace operated by ${partyIntroduction()}.`,
        `"${E.tradeName}" is a trade name. The company you are contracting with is ${E.legalName}, ` +
          `registered office at ${registeredOfficeLine()}. GSTIN: ${E.gstin}.`,
        `These Terms govern your use of the ${E.tradeName} app and website. By creating an account, ` +
          `browsing, or placing an order, you agree to them. They are an electronic record under the ` +
          `Information Technology Act, 2000.`,
        `You must be at least 18 years old to place an order. If you are under 18, you may use the ` +
          `platform only under the supervision of a parent or guardian who accepts these Terms.`,
      ],
    },
    {
      heading: '2. Our role — we are a marketplace',
      body: [
        `We connect you with independent local merchants. The merchant, not ${E.legalName}, is the ` +
          `seller of what you buy, and your contract of sale is with them.`,
        `The merchant is responsible for the quality, safety, quantity, packaging, labelling and ` +
          `description of the goods, and for issuing you a tax invoice.`,
        `We are responsible for operating the platform honestly: showing you the merchant's price and ` +
          `identity, collecting your payment correctly, arranging delivery where we offer it, and ` +
          `handling your complaint under clause 14. Where we get that wrong, we own it.`,
      ],
    },
    {
      heading: '3. Your account',
      list: [
        'Give accurate details — phone number, address and profile information — and keep them current, so your order reaches you.',
        'Keep your account and OTP secure. Never share an OTP with anyone, including someone claiming to be from JebDekho. We will never ask you for an OTP, a password, a card number, a CVV or a UPI PIN.',
        'You are responsible for activity on your account. Tell us at once if you think someone else has access to it.',
        'Do not use anyone else\'s account, or create an account to abuse offers, refunds or referrals.',
        'We may suspend an account involved in fraud, abuse of a delivery partner or merchant, or repeated unfounded refund claims. We will tell you why.',
      ],
    },
    {
      heading: '4. Prices, offers and orders',
      body: [
        `Merchants set their own prices. The price shown is inclusive of GST. Delivery and platform fees, ` +
          `where they apply, are shown separately before you pay.`,
        `The total you will pay is always shown before you confirm. We will never charge you more than ` +
          `that amount for an order.`,
        `Prices, offers and availability can change, and an item can go out of stock before a merchant ` +
          `accepts your order. Your order is confirmed only when the merchant accepts it. If it cannot be ` +
          `accepted, you are refunded in full.`,
        `Where a price is obviously wrong — a listing error — we or the merchant may cancel the order ` +
          `and refund you in full. We will not simply charge you the higher price.`,
      ],
    },
    {
      heading: '5. Payment',
      body: [
        `You can pay online through our payment partners, or by Cash on Delivery where it is offered. ` +
          `We collect payment on the merchant's behalf, so paying us discharges what you owe the ` +
          `merchant.`,
        `We do not store your full card number, CVV or UPI PIN. Online payments are handled by ` +
          `RBI-regulated payment partners.`,
        `If money leaves your account but the order does not confirm, it is refunded automatically. Bank ` +
          `reversal timelines are set by your bank, and usually take 5–7 working days.`,
        `For Cash on Delivery, please keep the exact amount ready. A delivery partner may decline an ` +
          `order where change is not available.`,
      ],
    },
    {
      heading: '6. Delivery',
      body: [
        `Delivery times shown are estimates, not guarantees. Traffic, weather, and merchant preparation ` +
          `time affect them.`,
        `Please be reachable on the phone number you gave, at the address you gave. Where an order ` +
          `cannot be delivered because nobody is reachable at the address after reasonable attempts, we ` +
          `may treat it as a failed delivery, and a refund may be reduced by the delivery cost actually ` +
          `incurred.`,
        `Some orders need an OTP to complete delivery. Share it only when you have the order in hand.`,
        `Please treat delivery partners with respect. Abuse, harassment, or any demand that a partner ` +
          `break a traffic law is a ground for suspending your account.`,
      ],
    },
    {
      heading: '7. Cancellation',
      body: [
        `You can cancel free of charge until the merchant starts preparing your order.`,
        `After preparation starts, a cancellation may attract a charge covering what the merchant and ` +
          `delivery partner have already spent. The charge is shown to you before you confirm the ` +
          `cancellation.`,
        `Fresh food, and any item prepared to your order, cannot be cancelled once it is being prepared, ` +
          `unless it is late beyond a reasonable time, or wrong, or unsafe.`,
        `We or the merchant may cancel an order — and refund you in full — where the item is out of ` +
          `stock, the address is outside a serviceable area, the merchant is closed, or we reasonably ` +
          `suspect fraud.`,
      ],
    },
    {
      heading: '8. Returns, replacements and refunds',
      body: [
        `Our published refund and return policy applies and forms part of these Terms.`,
        `Tell us at the time of delivery, or as soon as you reasonably can, if an item is wrong, damaged, ` +
          `expired, spoiled, short in quantity, or missing. A photograph helps us settle it quickly.`,
        `For eligible claims we will replace the item or refund you. For a return we may arrange a pickup ` +
          `from your address; where a pickup applies, the refund is processed after the item is collected.`,
        `Refunds go back to the original payment method, or to your bank account for a Cash on Delivery ` +
          `order. We process refunds promptly; the time to reach you depends on your bank.`,
        `Perishable and hygiene-sensitive items cannot be returned merely because you changed your mind. ` +
          `This does not affect your rights where an item is defective or not as described.`,
        `Nothing in these Terms takes away your rights under the Consumer Protection Act, 2019.`,
      ],
    },
    {
      heading: '9. Reviews and content',
      body: [
        `You may post reviews and photographs of what you actually bought. Be honest — a review must ` +
          `reflect your genuine experience.`,
        `Do not post anything unlawful, defamatory, obscene, hateful, or that infringes someone's ` +
          `rights, and do not post a paid or fake review.`,
        `You keep ownership of what you post, and grant us a non-exclusive, royalty-free licence to ` +
          `display and use it on the platform. We may remove content that breaches these Terms.`,
      ],
    },
    {
      heading: '10. Things you must not do',
      list: [
        'Use the platform for any unlawful purpose, or to buy or sell anything you are not lawfully entitled to.',
        'Interfere with the platform, or attempt to access it by any automated means, scraping, or by probing its security.',
        'Impersonate anyone, or misuse another person\'s payment instrument or personal data.',
        'Abuse offers, coupons, referrals or the refund process, including by creating multiple accounts.',
        'Copy, resell, or commercially exploit any part of the platform or its content without our written permission.',
      ],
    },
    {
      heading: '11. Your personal data',
      body: [
        `We handle your personal data as described in our Privacy Policy, under the Digital Personal Data ` +
          `Protection Act, 2023.`,
        `We share your name, address and phone number with the merchant and the delivery partner, only ` +
          `so your order can be fulfilled. They are not allowed to use it for anything else.`,
        `You can ask us to correct or delete your data, and you can withdraw consent, as the Privacy ` +
          `Policy explains.`,
      ],
    },
    {
      heading: '12. Our liability',
      body: [
        `We provide the platform with reasonable care and skill, but we do not promise it will always be ` +
          `available or error-free.`,
        `Because we are a marketplace and not the seller, we are not liable for the goods themselves — ` +
          `that is the merchant's responsibility. We are liable for our own failures in operating the ` +
          `platform, collecting payment, and handling your order and complaint.`,
        `Our total liability for any order is limited to the amount you paid for that order, plus any ` +
          `refund properly due to you. We are not liable for indirect or consequential loss.`,
        `Nothing here limits liability that cannot be limited by law, including for fraud or for death or ` +
          `personal injury caused by our negligence, and nothing here overrides the Consumer Protection ` +
          `Act, 2019.`,
      ],
    },
    {
      heading: '13. Changes to these Terms',
      body: [
        `We may update these Terms. Where a change materially affects your rights, we will notify you in ` +
          `the app or by email before it takes effect, and ask you to accept the new version.`,
        `Your acceptance is recorded with the version, date, time and IP address. Continuing to use the ` +
          `platform after the effective date means you accept the updated Terms.`,
      ],
    },
    {
      heading: '14. Complaints and grievance redressal',
      body: [
        `Please contact ${E.contact.support} first — most issues are resolved there quickly.`,
        `If you are not satisfied, you may escalate to our Grievance Officer, appointed under the ` +
          `Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology (Intermediary ` +
          `Guidelines and Digital Media Ethics Code) Rules, 2021:`,
        `${E.grievanceOfficer.name}, Grievance Officer, ${E.legalName}, ${registeredOfficeLine()}. ` +
          `Email: ${E.grievanceOfficer.email}. Phone: ${E.grievanceOfficer.phone}.`,
        `We acknowledge every complaint within 48 hours and ordinarily resolve it within 30 days.`,
        `You may also raise a complaint on the National Consumer Helpline (1915) or the ` +
          `consumerhelpline.gov.in portal.`,
      ],
    },
    {
      heading: '15. Governing law and jurisdiction',
      body: [
        `These Terms are governed by the laws of India. The courts at ${E.jurisdictionCity} have ` +
          `jurisdiction, and this does not affect any right you have under consumer law to approach a ` +
          `consumer forum where you reside.`,
      ],
    },
  ],
};
