import { LegalDocumentCode } from '@prisma/client';
import type { LegalDocument } from '../legal-document.types';
import { LEGAL_ENTITY, partyIntroduction, registeredOfficeLine } from '../legal-entity';

const E = LEGAL_ENTITY;

/**
 * Marketplace seller agreement.
 *
 * Commission and fees are referenced, never hard-coded: rates are configured per
 * category/store as CommissionRules and shown on the merchant's rate card, so a
 * number written here would go stale and contradict what is actually charged.
 */
export const MERCHANT_AGREEMENT: LegalDocument = {
  code: LegalDocumentCode.MERCHANT_AGREEMENT,
  title: 'Merchant Partner Agreement',
  version: 'v1',
  effectiveDate: '2026-07-17',
  summary:
    `I have read and accept the ${E.tradeName} Merchant Partner Agreement, including the ` +
    `commission, settlement, return and delisting terms.`,
  sections: [
    {
      heading: '1. Parties',
      body: [
        `This Merchant Partner Agreement ("Agreement") is entered into between ${partyIntroduction()} ` +
          `("Company", "we", "us"), and the person or entity registering as a merchant on the ` +
          `platform ("Merchant", "you").`,
        `"${E.tradeName}" is a trade name under which the Company operates. The contracting party ` +
          `is ${E.legalName}. By ticking the acceptance box and continuing, you agree to this ` +
          `Agreement, which is an electronic record under the Information Technology Act, 2000 and ` +
          `does not require a physical signature.`,
        `If you accept on behalf of a business entity, you represent that you are authorised to ` +
          `bind that entity, and "Merchant" means that entity.`,
      ],
    },
    {
      heading: '2. Our role — marketplace only',
      body: [
        `The Company operates an online marketplace. It is an intermediary under section 2(w) of the ` +
          `Information Technology Act, 2000 and a "marketplace e-commerce entity" under the Consumer ` +
          `Protection (E-Commerce) Rules, 2020.`,
        `You are the seller and supplier of every product or menu item you list. The contract of sale ` +
          `is between you and the customer. The Company is not the seller, does not own the inventory, ` +
          `and takes no title to it at any time.`,
        `You alone are responsible for the quality, safety, legality, labelling, packaging, weights and ` +
          `measures, and description of what you sell, and for all statutory liability arising from it.`,
      ],
    },
    {
      heading: '3. Onboarding, KYC and verification',
      body: [
        `Registration is complete only when the Company approves your store after verification. We may ` +
          `refuse, defer or reverse approval at our discretion.`,
        `You must provide true, current and complete information, and update it within 7 days of any ` +
          `change. We may re-verify at any time and may suspend listings pending re-verification.`,
      ],
      list: [
        'PAN of the registering person or entity',
        'GST registration certificate, where you are liable to be registered',
        'FSSAI licence or registration, for any food, beverage or nutraceutical listing — no food item may be listed or sold without it',
        'Trade licence or municipal permission, where applicable to your category',
        'Bank account proof in the name of the registering person or entity, for settlements',
        'Any further document reasonably required for a specific category',
      ],
    },
    {
      heading: '4. Catalogue and listing obligations',
      body: [
        `You may list only in categories approved for your store. Category approval is granted through ` +
          `the platform's category governance flow and may be conditioned on further documents.`,
        `Listings must be accurate and not misleading. Images must depict the actual product. You must ` +
          `not misrepresent brand, origin, quantity, expiry, composition or certification.`,
        `You must not list anything you are not lawfully entitled to sell, or anything prohibited by ` +
          `law or by our published prohibited-items policy — including but not limited to narcotics, ` +
          `tobacco and alcohol where unlicensed, prescription medicines without a valid licence, ` +
          `weapons, wildlife products, counterfeit or infringing goods, and expired or recalled stock.`,
        `We may edit, reclassify, delist or refuse any listing that we reasonably believe breaches this ` +
          `Agreement or the law, without prior notice where consumer safety is involved.`,
      ],
    },
    {
      heading: '5. Pricing, taxes and invoices',
      body: [
        `You set your own prices. Nothing in this Agreement requires you to sell at a price set by the ` +
          `Company, and the Company does not mandate resale prices.`,
        `The price you display must be the all-inclusive price payable by the customer, inclusive of ` +
          `GST and of any charge you levy, exclusive only of delivery and platform fees shown ` +
          `separately at checkout.`,
        `You are the supplier for GST purposes. You are responsible for charging the correct rate, ` +
          `issuing a tax invoice to the customer for every order, and for your own GST, e-invoicing and ` +
          `e-way bill compliance. The Company may collect tax at source (TCS) under section 52 of the ` +
          `CGST Act, 2017 and deduct tax at source (TDS) under section 194-O of the Income-tax Act, ` +
          `1961 where applicable, and will report such amounts against your PAN/GSTIN.`,
      ],
    },
    {
      heading: '6. Orders and fulfilment',
      body: [
        `An order placed by a customer and accepted by you is a binding contract between you and the ` +
          `customer. You must keep your catalogue and stock status current so that you do not accept ` +
          `orders you cannot fulfil.`,
        `You must prepare and hand over each order within the preparation time shown for your store, ` +
          `packaged so it survives normal transit, and tamper-evident for food.`,
        `Repeated late handover, or cancellation of accepted orders, is a material breach. It may attract ` +
          `the consequences in clause 12, including reduced visibility, suspension or delisting.`,
      ],
    },
    {
      heading: '7. Commission and fees',
      body: [
        `You authorise the Company to deduct commission and applicable fees from the value of each ` +
          `order before settling the balance to you.`,
        `Commission rates, platform fees, payment gateway charges and any other deductions are as ` +
          `published on your merchant dashboard rate card, which forms part of this Agreement. Rates may ` +
          `differ by category, store and time.`,
        `We will give you at least 15 days' notice on the dashboard or by email before an increase in ` +
          `commission takes effect. Continuing to list after the effective date is acceptance. If you do ` +
          `not accept, you may terminate under clause 13 before that date.`,
        `The Company will issue you a tax invoice for its commission and fees.`,
      ],
    },
    {
      heading: '8. Payments and settlement',
      body: [
        `Customer payments are collected by the Company or its payment partners on your behalf, as your ` +
          `payment collection agent. Payment by the customer to the Company discharges the customer's ` +
          `obligation to you.`,
        `Settlements are made to the bank account linked to your verified payment account, on the ` +
          `settlement cycle shown on your dashboard, net of commission, fees, taxes, refunds, chargebacks ` +
          `and any amount recoverable under this Agreement.`,
        `Cash-on-delivery amounts collected on your behalf are settled on the same basis, net of the same ` +
          `deductions.`,
        `We may withhold or reverse a settlement, in whole or part, where we reasonably suspect fraud, a ` +
          `chargeback, a customer claim, a statutory demand, or a breach of this Agreement, for as long ` +
          `as reasonably needed to resolve it. We will tell you why, and release any amount not applied.`,
        `You must raise any settlement dispute within 30 days of the settlement date, failing which it is ` +
          `treated as accepted.`,
      ],
    },
    {
      heading: '9. Cancellations, returns, replacements and refunds',
      body: [
        `Our published cancellation, return and refund policy applies to orders on the platform and forms ` +
          `part of this Agreement.`,
        `Where an item is returned or an order cancelled for a reason attributable to you — including ` +
          `wrong, damaged, expired, missing, short-quantity, spoiled or misdescribed goods — the refund ` +
          `to the customer is borne by you and recovered from your settlements, together with any ` +
          `reverse-logistics cost.`,
        `Where the reason is attributable to the Company or its delivery partner, the Company bears it.`,
        `We may refund a customer without your prior approval where the claim is evidenced and within ` +
          `policy. You may dispute the attribution within 7 days with evidence, and we will review in ` +
          `good faith.`,
      ],
    },
    {
      heading: '10. Compliance, quality and audit',
      body: [
        `You must comply with all applicable laws, including the Consumer Protection Act, 2019 and the ` +
          `Consumer Protection (E-Commerce) Rules, 2020; the Food Safety and Standards Act, 2006 and its ` +
          `regulations; the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) ` +
          `Rules, 2011; and the Drugs and Cosmetics Act, 1940, each to the extent applicable to you.`,
        `You must not engage in unfair trade practices, fake or incentivised reviews, or manipulation of ` +
          `ratings, search ranking or offers.`,
        `We may inspect your premises, stock and records on reasonable notice, and may require corrective ` +
          `action within a stated time, where we have a reasonable basis relating to consumer safety or ` +
          `legal compliance.`,
      ],
    },
    {
      heading: '11. Intellectual property and content',
      body: [
        `You retain ownership of your trade marks, product images and content. You grant the Company a ` +
          `non-exclusive, royalty-free, worldwide licence to host, display, reproduce, resize, and use ` +
          `them to list, promote and operate the platform, and to market the platform, for as long as you ` +
          `are on the platform and for a reasonable period after, for archival and legal purposes.`,
        `You warrant that this content is yours to license and does not infringe anyone's rights. You ` +
          `must not use the Company's marks, including "${E.tradeName}", except as we permit in writing.`,
        `Where an AI-assisted tool on the platform generates or edits an image or description from what ` +
          `you upload, you remain responsible for verifying that the result is accurate and not ` +
          `misleading before it is published.`,
      ],
    },
    {
      heading: '12. Suspension',
      body: [
        `We may suspend your store, a listing, a payout, or your access, immediately and without prior ` +
          `notice, where we reasonably believe there is fraud, a risk to consumer health or safety, a ` +
          `legal or regulatory requirement, a lapsed or invalid licence, or a serious breach of this ` +
          `Agreement.`,
        `We will inform you of the reason and, where the breach can be cured, give you a reasonable ` +
          `opportunity to cure it. Suspension does not by itself terminate this Agreement.`,
      ],
    },
    {
      heading: '13. Term and termination',
      body: [
        `This Agreement starts when you accept it and continues until terminated.`,
        `You may terminate at any time by giving 15 days' notice through the dashboard or to ` +
          `${E.contact.merchant}, provided you fulfil or duly cancel all accepted orders.`,
        `We may terminate for convenience on 30 days' notice, or immediately for a material breach that ` +
          `is not cured within 7 days of notice, or immediately on any ground in clause 12 that cannot be ` +
          `cured.`,
        `On termination your listings are removed. Amounts due to you are settled in the ordinary cycle ` +
          `after deducting all recoverable amounts, subject to a hold of up to 90 days against pending ` +
          `returns, claims and chargebacks. Clauses 5, 8, 9, 11, 14, 15, 16, 17 and 18 survive.`,
      ],
    },
    {
      heading: '14. Representations and warranties',
      list: [
        'You have the legal capacity and authority to enter into this Agreement.',
        'You hold, and will maintain, every registration, licence and permission your business and categories require.',
        'The information and documents you give us are true, and you will keep them current.',
        'You have good title to the goods you sell and the right to sell them.',
        'You will not use the platform for money laundering, tax evasion, or any unlawful purpose.',
      ],
    },
    {
      heading: '15. Indemnity',
      body: [
        `You will indemnify and hold harmless the Company, its group companies, and their directors, ` +
          `officers and employees, against any claim, demand, penalty, loss, damage or expense (including ` +
          `reasonable legal fees) arising out of: the products or services you sell; your breach of this ` +
          `Agreement or of any law; any misrepresentation in your listings; any infringement of a third ` +
          `party's rights by your content; and any tax, duty or statutory demand attributable to you.`,
      ],
    },
    {
      heading: '16. Limitation of liability',
      body: [
        `The Company's aggregate liability to you under this Agreement, for all claims in any 12-month ` +
          `period, is limited to the total commission actually received by the Company from you in the 3 ` +
          `months immediately preceding the event giving rise to the claim.`,
        `Neither party is liable for indirect, incidental, special, punitive or consequential loss, or ` +
          `for loss of profit, revenue, goodwill or data, however arising.`,
        `Nothing in this Agreement excludes liability that cannot be excluded under applicable law, ` +
          `including liability for fraud or for death or personal injury caused by negligence.`,
      ],
    },
    {
      heading: '17. Confidentiality and data protection',
      body: [
        `Each party must keep the other's non-public information confidential and use it only for this ` +
          `Agreement.`,
        `Customer personal data made available to you — including name, address and phone number — is ` +
          `shared solely to fulfil the order. You must process it only for that purpose, keep it secure, ` +
          `not retain it longer than needed, never use it for your own marketing, and never sell or ` +
          `transfer it. You must comply with the Digital Personal Data Protection Act, 2023.`,
        `You must report any personal data breach affecting platform data to ${E.contact.merchant} ` +
          `without undue delay and in any event within 24 hours of becoming aware of it.`,
      ],
    },
    {
      heading: '18. Governing law, disputes and jurisdiction',
      body: [
        `This Agreement is governed by the laws of India.`,
        `The parties will first attempt to resolve any dispute amicably within 30 days of written notice. ` +
          `Failing that, the dispute is referred to arbitration by a sole arbitrator appointed by the ` +
          `Company, under the Arbitration and Conciliation Act, 1996. The seat and venue is ` +
          `${E.jurisdictionCity}, and the language is English. The award is final and binding.`,
        `Subject to the arbitration clause, the courts at ${E.jurisdictionCity} have exclusive ` +
          `jurisdiction.`,
        `Nothing here prevents either party from seeking urgent interim relief from a court.`,
      ],
    },
    {
      heading: '19. Relationship of the parties',
      body: [
        `The parties are independent contractors. Nothing in this Agreement creates a partnership, joint ` +
          `venture, agency, franchise or employment relationship, except that the Company acts as your ` +
          `payment collection agent as stated in clause 8. Neither party may bind the other.`,
      ],
    },
    {
      heading: '20. Changes to this Agreement',
      body: [
        `We may amend this Agreement by publishing a new version. We will notify you on the dashboard or ` +
          `by email at least 15 days before it takes effect, unless a change is required immediately by ` +
          `law or for security.`,
        `You will be asked to accept the new version. If you do not accept it, you may terminate under ` +
          `clause 13; continuing to list after the effective date is acceptance.`,
        `Each acceptance is recorded with the version, date, time and IP address, and that record is ` +
          `evidence of what you agreed to.`,
      ],
    },
    {
      heading: '21. Notices and grievances',
      body: [
        `Notices to you are validly given to the email address or dashboard account you registered. ` +
          `Notices to the Company must go to ${E.contact.merchant} and, for legal notices, to ` +
          `${E.legalName} at ${registeredOfficeLine()}.`,
        `Grievance Officer (under the Consumer Protection (E-Commerce) Rules, 2020 and the Information ` +
          `Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021): ` +
          `${E.grievanceOfficer.name}, ${E.grievanceOfficer.email}, ${E.grievanceOfficer.phone}, at ` +
          `${registeredOfficeLine()}. Complaints are acknowledged within 48 hours and ordinarily resolved ` +
          `within 30 days.`,
      ],
    },
    {
      heading: '22. General',
      body: [
        `Neither party is liable for failure caused by an event beyond its reasonable control, including ` +
          `act of God, war, riot, epidemic, government action, or failure of public infrastructure or the ` +
          `internet.`,
        `You may not assign this Agreement without our written consent. We may assign it to a group ` +
          `company or an acquirer of the business.`,
        `If a clause is held unenforceable, the rest remains in force. A failure to enforce a right is ` +
          `not a waiver of it.`,
        `This Agreement, with the documents it refers to, is the entire agreement between the parties on ` +
          `its subject matter, and supersedes prior discussions.`,
      ],
    },
  ],
};
