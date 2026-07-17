import { LegalDocumentCode } from '@prisma/client';
import type { LegalDocument } from '../legal-document.types';
import { LEGAL_ENTITY, partyIntroduction, registeredOfficeLine } from '../legal-entity';

const E = LEGAL_ENTITY;

/**
 * Delivery partner agreement, on an independent-contractor basis.
 *
 * The independence is not a label — the clauses have to actually support it, so
 * this document deliberately grants the rider control over when and whether to
 * work and never uses employment vocabulary ("salary", "shift", "leave",
 * "duty"). Contradicting that elsewhere in the product is what gets an
 * arrangement re-characterised as employment.
 */
export const RIDER_AGREEMENT: LegalDocument = {
  code: LegalDocumentCode.RIDER_AGREEMENT,
  title: 'Delivery Partner Agreement',
  version: 'v1',
  effectiveDate: '2026-07-17',
  summary:
    `I have read and accept the ${E.tradeName} Delivery Partner Agreement. I understand I am an ` +
    `independent contractor and not an employee.`,
  sections: [
    {
      heading: '1. Parties and nature of this agreement',
      body: [
        `This Delivery Partner Agreement ("Agreement") is between ${partyIntroduction()} ("Company", ` +
          `"we", "us"), and the individual registering as a delivery partner ("Delivery Partner", ` +
          `"you").`,
        `"${E.tradeName}" is a trade name; the contracting party is ${E.legalName}. By ticking the ` +
          `acceptance box you agree to this Agreement, which is an electronic record under the ` +
          `Information Technology Act, 2000 and needs no physical signature.`,
        `Please read clause 2. It describes the most important thing about this arrangement: you are ` +
          `running your own service, not taking a job.`,
      ],
    },
    {
      heading: '2. You are an independent contractor, not an employee',
      body: [
        `You provide delivery services as an independent contractor on a principal-to-principal basis. ` +
          `This Agreement does not create employment, and does not create a partnership, agency (except ` +
          `for cash collection under clause 8) or joint venture.`,
        `You are not entitled to salary, wages, provident fund, gratuity, bonus, paid leave, or any ` +
          `other benefit that flows from employment, and you agree not to claim any.`,
        `The Company is an aggregator under the Code on Social Security, 2020, and will make the ` +
          `contributions and provide the benefits that the Code and any applicable State gig-worker law ` +
          `require. Those statutory benefits do not make you an employee.`,
      ],
      list: [
        'You choose whether to go online, when, and for how long. You are not required to work any minimum hours.',
        'You may decline any delivery request. Declining is not a breach of this Agreement.',
        'You may provide services to any other platform or person, including our competitors, at any time.',
        'You provide your own vehicle, phone and data connection, and bear their running costs.',
        'No one at the Company supervises how you ride or plans your day. Route guidance in the app is assistance, not instruction.',
      ],
    },
    {
      heading: '3. Eligibility and onboarding',
      body: [
        `You must be at least 18 years old and legally entitled to work in India.`,
        `You must give true information and valid documents, and keep them current. We may verify them, ` +
          `including through a background check, and may refuse or end onboarding based on the result.`,
        `You must not let anyone else use your account, and must not perform deliveries assigned to ` +
          `another person's account. Account sharing is a material breach and a safety risk.`,
      ],
      list: [
        'Government photo identity and address proof (for example, Aadhaar or passport)',
        'PAN',
        'A valid driving licence for the vehicle class you use, where the vehicle is a motor vehicle',
        'Valid vehicle registration, insurance, and pollution certificate, where applicable',
        'Bank account details in your own name, for payouts',
      ],
    },
    {
      heading: '4. Providing the service',
      body: [
        `When you accept a request, you undertake to collect the order from the pickup point and deliver ` +
          `it to the customer's address, in the condition you received it, within a reasonable time.`,
        `You must deliver only to the customer or a person at the address, and must complete any ` +
          `verification the app requires, including the delivery OTP. You must never share or bypass the ` +
          `OTP, and never mark an order delivered that you have not delivered.`,
        `You must keep food orders upright, sealed and in an insulated bag, and must not open, tamper ` +
          `with, consume or substitute any part of an order.`,
        `If you cannot complete a delivery after accepting it, tell us through the app promptly so the ` +
          `order can be reassigned.`,
      ],
    },
    {
      heading: '5. Safety and the law',
      body: [
        `You must obey all traffic laws, including the Motor Vehicles Act, 1988. You must wear a helmet, ` +
          `never ride under the influence of alcohol or drugs, and never use a handheld phone while ` +
          `riding.`,
        `No delivery time shown in the app is a reason to break a traffic law or take a risk. If a time ` +
          `estimate and safety conflict, safety wins, and we will not penalise you for it.`,
        `You must not carry a passenger or any goods other than the order while performing a delivery.`,
        `You must maintain valid third-party motor insurance as the law requires. The Company's ` +
          `insurance cover, where provided, is stated in the app and is in addition to, not a substitute ` +
          `for, your own.`,
        `Tell us as soon as you can about any accident, injury, theft, or police matter that occurs ` +
          `while performing a delivery.`,
      ],
    },
    {
      heading: '6. Conduct',
      body: [
        `You must behave courteously and professionally with customers, merchants and our staff.`,
        `Harassment, discrimination, intimidation, violence, or any sexual misconduct will end this ` +
          `Agreement immediately and may be reported to the police.`,
        `You must not contact a customer after a delivery for any reason unconnected with it, and must ` +
          `not use their personal data for any other purpose.`,
        `You must not demand any amount from a customer beyond what the app shows, and must not solicit ` +
          `a tip.`,
      ],
    },
    {
      heading: '7. Earnings and payouts',
      body: [
        `You are paid a fee for each completed delivery, calculated on the earnings structure published ` +
          `in the app — which may include distance, time, order type, surge and incentives. The ` +
          `structure in the app at the time of the delivery is the one that applies.`,
        `We may change the earnings structure prospectively by publishing it in the app with at least 7 ` +
          `days' notice. Changes do not apply to deliveries already completed.`,
        `Earnings are aggregated and paid to your registered bank account on the payout cycle shown in ` +
          `the app, net of any amount recoverable under clause 8 or 9, and net of tax withheld where the ` +
          `Income-tax Act, 1961 requires it. You are responsible for your own income tax and, if you ` +
          `cross the threshold, your own GST registration and compliance.`,
        `Tips a customer gives you are yours in full, and the Company takes no share of them.`,
        `Raise any payout dispute within 30 days of the payout date, with details. We will review it in ` +
          `good faith.`,
      ],
    },
    {
      heading: '8. Cash on delivery',
      body: [
        `Where you collect cash, you collect it solely as our limited agent, on behalf of the merchant. ` +
          `The cash is not yours at any point.`,
        `You must remit or deposit it by the method and within the time the app states. Cash in hand may ` +
          `be adjusted against your payouts.`,
        `Failure to remit collected cash is a material breach, and the Company may recover the amount ` +
          `from your payouts and by any lawful means.`,
      ],
    },
    {
      heading: '9. Liability for loss',
      body: [
        `You are responsible for an order from pickup until delivery. Where an order is lost, stolen ` +
          `while in your custody, damaged by your negligence, or not delivered but marked delivered, the ` +
          `Company may recover its value from your payouts, after telling you the reason and giving you ` +
          `a fair chance to explain.`,
        `You are not responsible for loss caused by the merchant's packaging, by a defect that existed ` +
          `at pickup, or by an event beyond your reasonable control that you report promptly.`,
        `Recovery under this clause is capped at the order value, and the Company will not recover the ` +
          `same loss twice.`,
      ],
    },
    {
      heading: '10. Data protection and confidentiality',
      body: [
        `Customer and merchant details you see — name, address, phone number, order contents — are ` +
          `shared only to complete the delivery. Use them for nothing else, do not record or retain them ` +
          `after delivery, and never share or sell them. The Digital Personal Data Protection Act, 2023 ` +
          `applies.`,
        `We collect your location while you are online, to assign and track deliveries, to support you, ` +
          `and for safety. We stop collecting it when you go offline. Our Privacy Policy explains what we ` +
          `collect and why.`,
      ],
    },
    {
      heading: '11. Deactivation and termination',
      body: [
        `You may stop providing services at any time and may terminate this Agreement on 7 days' notice ` +
          `through the app or to ${E.contact.partners}.`,
        `We may deactivate your account immediately where there is a credible allegation of fraud, theft, ` +
          `tampering, OTP misuse, account sharing, riding under the influence, violence or harassment, an ` +
          `invalid or expired licence, or a serious safety risk.`,
        `Before a permanent deactivation for cause, we will tell you the reason and give you a genuine ` +
          `opportunity to respond, and a person — not an automated system alone — will decide. This does ` +
          `not apply where the law or an imminent safety risk requires immediate action.`,
        `We may terminate for convenience on 15 days' notice. On termination, earnings already accrued ` +
          `are paid in the ordinary cycle, net of clause 8 and 9 recoveries.`,
        `Deactivation is not a penalty for declining requests or for being offline.`,
      ],
    },
    {
      heading: '12. Indemnity and limitation of liability',
      body: [
        `You will indemnify the Company against any claim, penalty, loss or expense arising from your ` +
          `breach of this Agreement, your breach of any law, your negligence, or any act or omission of ` +
          `yours while performing a delivery.`,
        `The Company's aggregate liability to you for all claims in any 12-month period is limited to the ` +
          `total fees paid to you in the 3 months immediately preceding the event giving rise to the ` +
          `claim. Neither party is liable for indirect or consequential loss.`,
        `Nothing here excludes liability that cannot be excluded by law, including for fraud or for death ` +
          `or personal injury caused by negligence.`,
      ],
    },
    {
      heading: '13. Governing law, disputes and jurisdiction',
      body: [
        `This Agreement is governed by the laws of India.`,
        `We will first try to resolve any dispute through our grievance process within 30 days. Failing ` +
          `that, it is referred to arbitration by a sole arbitrator under the Arbitration and ` +
          `Conciliation Act, 1996, with seat and venue at ${E.jurisdictionCity} and proceedings in ` +
          `English. Where you ask for it, the arbitration may be conducted by video conference, and the ` +
          `Company will bear the arbitrator's fee.`,
        `Subject to that, the courts at ${E.jurisdictionCity} have exclusive jurisdiction.`,
      ],
    },
    {
      heading: '14. Changes, notices and grievances',
      body: [
        `We may amend this Agreement by publishing a new version and notifying you in the app at least 7 ` +
          `days before it takes effect, unless the law requires it sooner. You will be asked to accept ` +
          `the new version, and each acceptance is recorded with the version, date, time and IP address.`,
        `Grievance Officer: ${E.grievanceOfficer.name}, ${E.grievanceOfficer.email}, ` +
          `${E.grievanceOfficer.phone}, at ${registeredOfficeLine()}. Complaints are acknowledged within ` +
          `48 hours and ordinarily resolved within 30 days.`,
        `You may not assign this Agreement, as it is personal to you. We may assign it to a group company ` +
          `or an acquirer of the business. If a clause is unenforceable, the rest stands.`,
      ],
    },
  ],
};
