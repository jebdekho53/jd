import { LegalDocumentCode } from '@prisma/client';
import type { LegalDocument } from '../legal-document.types';
import { LEGAL_ENTITY, partyIntroduction, registeredOfficeLine } from '../legal-entity';

const E = LEGAL_ENTITY;

/**
 * Territory partner agreement, branded "Franchise Partner".
 *
 * The mechanics here follow what the platform actually does: the partner earns a
 * share of the Company's own commission on orders in an exclusive pincode
 * territory (FranchisePartner.commissionPercent, default 10), and pays no
 * franchise fee or deposit. Drafting it as a classic fee-paying franchise would
 * describe an arrangement that does not exist.
 */
export const FRANCHISE_AGREEMENT: LegalDocument = {
  code: LegalDocumentCode.FRANCHISE_AGREEMENT,
  title: 'Franchise Partner Agreement',
  version: 'v1',
  effectiveDate: '2026-07-17',
  summary:
    `I have read and accept the ${E.tradeName} Franchise Partner Agreement, including the ` +
    `exclusive-territory, revenue-share and termination terms.`,
  sections: [
    {
      heading: '1. Parties',
      body: [
        `This Franchise Partner Agreement ("Agreement") is between ${partyIntroduction()} ("Company", ` +
          `"we", "us"), and the person or entity approved as a franchise partner ("Partner", "you").`,
        `"${E.tradeName}" is a trade name; the contracting party is ${E.legalName}. By ticking the ` +
          `acceptance box you agree to this Agreement, which is an electronic record under the ` +
          `Information Technology Act, 2000 and needs no physical signature.`,
        `This Agreement takes effect only once the Company has approved your application and your KYC ` +
          `is complete.`,
      ],
    },
    {
      heading: '2. What this arrangement is',
      body: [
        `You are appointed as the Company's territory partner for the area defined in clause 3. You ` +
          `develop and support the ${E.tradeName} network in that territory — bringing merchants and ` +
          `delivery partners onto the platform and supporting them — and earn a share of the Company's ` +
          `commission on orders from it, as set out in clause 5.`,
        `You are an independent contractor on a principal-to-principal basis. This Agreement creates no ` +
          `employment, partnership, joint venture, or agency, and neither party may bind the other. You ` +
          `bear your own costs and engage your own personnel, who are your responsibility alone.`,
        `You are not the seller of any product and are not the Company's payment agent. Orders are ` +
          `contracted between the customer and the merchant, and settled by the Company.`,
      ],
    },
    {
      heading: '3. Territory and exclusivity',
      body: [
        `Your territory is the set of pincodes recorded against your partner account, as shown on your ` +
          `dashboard.`,
        `For as long as this Agreement is in force and you meet the performance expectations in clause 7, ` +
          `the Company will not appoint another franchise partner for the same pincodes.`,
        `Exclusivity is limited to the appointment of other franchise partners. It does not restrict the ` +
          `Company from operating in your territory itself, from onboarding merchants or delivery ` +
          `partners directly, from serving customers there, or from fulfilling orders from stores outside ` +
          `your territory.`,
        `Territory changes require written agreement, except that the Company may adjust a pincode where ` +
          `it is required by law or by a postal or administrative redefinition.`,
      ],
    },
    {
      heading: '4. What you will do',
      list: [
        'Identify, onboard and support merchants and delivery partners in your territory.',
        'Help merchants with catalogue quality, pricing hygiene, and order acceptance and preparation times.',
        'Support delivery-partner supply so orders in your territory are served reliably.',
        'Act as the first line of local escalation for merchant and delivery-partner issues.',
        'Represent the Company accurately, and never make a commitment on its behalf that this Agreement does not permit.',
        'Comply with all applicable laws, and hold any registration your own activity requires.',
      ],
    },
    {
      heading: '5. Revenue share',
      body: [
        `The Company charges merchants a commission on orders. You earn a percentage of the commission ` +
          `the Company actually earns on qualifying orders in your territory. That percentage is recorded ` +
          `against your partner account and shown on your dashboard.`,
        `Your share is calculated on the Company's commission, not on order value, and not on delivery ` +
          `fees, platform fees, taxes, or tips.`,
        `An order does not qualify where it is cancelled, fully refunded, or found to be fraudulent. ` +
          `Where an order is refunded after your share has been credited, the share is reversed and ` +
          `adjusted against future settlements.`,
        `There is no franchise fee, royalty or security deposit under this Agreement. The Company will ` +
          `not ask you for money to hold this appointment, and you should treat any such demand as ` +
          `fraudulent and report it to ${E.contact.partners}.`,
        `We may change your percentage prospectively by giving you at least 30 days' written notice. If ` +
          `you do not accept the change, you may terminate under clause 9 before it takes effect.`,
      ],
    },
    {
      heading: '6. Settlement, KYC and taxes',
      body: [
        `Your share accrues per qualifying order and is settled to your verified bank account on the ` +
          `settlement cycle shown on your dashboard, net of reversals and any amount recoverable under ` +
          `this Agreement.`,
        `Settlement is conditional on completed KYC — acceptance of this Agreement, PAN verification, and ` +
          `bank account verification in your own name. We may withhold settlement while KYC is ` +
          `incomplete or under re-verification, or where we reasonably suspect fraud, and will tell you ` +
          `why.`,
        `You are responsible for your own income tax and, where applicable, GST registration, invoicing ` +
          `and compliance. The Company will deduct tax at source where the Income-tax Act, 1961 requires ` +
          `it, and report it against your PAN.`,
        `Raise any settlement dispute within 30 days of the settlement date, failing which it is treated ` +
          `as accepted.`,
      ],
    },
    {
      heading: '7. Performance',
      body: [
        `The Company may publish reasonable performance expectations for your territory on your ` +
          `dashboard — for example, active merchants, order volume, or service levels.`,
        `Where performance falls materially short, we will tell you in writing, give you at least 60 days ` +
          `to improve, and support you during that period. If it is still materially short after that, we ` +
          `may withdraw exclusivity under clause 3 or terminate under clause 9. We will not do either ` +
          `without that notice and opportunity.`,
      ],
    },
    {
      heading: '8. Brand, confidentiality and data',
      body: [
        `The Company grants you a non-exclusive, non-transferable, revocable licence to use the ` +
          `"${E.tradeName}" name and marks solely to perform this Agreement in your territory, in the ` +
          `form we approve. You acquire no ownership in them. The licence ends automatically when this ` +
          `Agreement ends, and you must then stop using them.`,
        `You must not register, or attempt to register, any name, mark or domain that is identical or ` +
          `confusingly similar to the Company's.`,
        `You must keep the Company's non-public information confidential, including commercial terms, ` +
          `merchant lists and platform data, and use it only for this Agreement. This survives ` +
          `termination.`,
        `Personal data of merchants, customers or delivery partners that you access is shared only to ` +
          `perform this Agreement. Use it for nothing else, keep it secure, never retain it after ` +
          `termination, and never sell or transfer it. The Digital Personal Data Protection Act, 2023 ` +
          `applies. Report any breach to ${E.contact.partners} within 24 hours of becoming aware.`,
      ],
    },
    {
      heading: '9. Term and termination',
      body: [
        `This Agreement starts on acceptance and continues until terminated.`,
        `You may terminate on 30 days' written notice to ${E.contact.partners}.`,
        `The Company may terminate on 60 days' written notice, or immediately for a material breach not ` +
          `cured within 15 days of notice, or immediately and without notice where there is fraud, ` +
          `misappropriation, misuse of the brand or of personal data, or a demand for money made in the ` +
          `Company's name.`,
        `On termination: exclusivity and the brand licence end at once; shares accrued on qualifying ` +
          `orders up to the termination date are settled in the ordinary cycle, subject to a hold of up ` +
          `to 90 days against reversals and claims; and you must return or delete the Company's ` +
          `confidential information and data.`,
        `Clauses 6, 8, 10, 11, 12 and 13 survive termination.`,
      ],
    },
    {
      heading: '10. Representations and warranties',
      list: [
        'You have the legal capacity and authority to enter into this Agreement, and to bind the entity if you accept for one.',
        'The information and documents you give us are true, and you will keep them current.',
        'You will not pay or accept any bribe, kickback or unlawful inducement in connection with this Agreement.',
        'You will not collect money from any merchant, delivery partner or customer in the Company\'s name.',
      ],
    },
    {
      heading: '11. Indemnity and limitation of liability',
      body: [
        `You will indemnify the Company against any claim, penalty, loss or expense arising from your ` +
          `breach of this Agreement or of any law, from any representation you make beyond your ` +
          `authority, and from any act or omission of the personnel you engage.`,
        `The Company's aggregate liability to you for all claims in any 12-month period is limited to the ` +
          `total revenue share paid to you in the 3 months immediately preceding the event giving rise to ` +
          `the claim. Neither party is liable for indirect or consequential loss, or for loss of profit ` +
          `or anticipated earnings.`,
        `Nothing here excludes liability that cannot be excluded by law, including for fraud.`,
        `The Company makes no representation or guarantee about the volume of orders, the number of ` +
          `merchants, or the earnings you will achieve. Any projection shared during discussions is an ` +
          `estimate, not a promise.`,
      ],
    },
    {
      heading: '12. Governing law, disputes and jurisdiction',
      body: [
        `This Agreement is governed by the laws of India.`,
        `The parties will first attempt to resolve any dispute amicably within 30 days of written notice. ` +
          `Failing that, it is referred to arbitration by a sole arbitrator appointed by the Company ` +
          `under the Arbitration and Conciliation Act, 1996, with seat and venue at ${E.jurisdictionCity} ` +
          `and proceedings in English. The award is final and binding.`,
        `Subject to that, the courts at ${E.jurisdictionCity} have exclusive jurisdiction. Either party ` +
          `may seek urgent interim relief from a court.`,
      ],
    },
    {
      heading: '13. Changes, notices and grievances',
      body: [
        `We may amend this Agreement by publishing a new version and notifying you on the dashboard or by ` +
          `email at least 30 days before it takes effect. You will be asked to accept it; if you do not, ` +
          `you may terminate under clause 9. Each acceptance is recorded with the version, date, time and ` +
          `IP address, and is evidence of what you agreed to.`,
        `Notices to you go to your registered email or dashboard. Notices to the Company go to ` +
          `${E.contact.partners} and, for legal notices, to ${E.legalName} at ${registeredOfficeLine()}.`,
        `Grievance Officer: ${E.grievanceOfficer.name}, ${E.grievanceOfficer.email}, ` +
          `${E.grievanceOfficer.phone}, at ${registeredOfficeLine()}. Complaints are acknowledged within ` +
          `48 hours and ordinarily resolved within 30 days.`,
        `You may not assign this Agreement without our written consent. We may assign it to a group ` +
          `company or an acquirer. If a clause is unenforceable, the rest stands, and a failure to ` +
          `enforce a right is not a waiver.`,
      ],
    },
  ],
};
