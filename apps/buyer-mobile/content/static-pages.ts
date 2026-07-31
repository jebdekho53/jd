/** Copy for the informational screens, kept in step with buyer-web's
 *  /about, /privacy and /refund-policy pages.
 *
 *  Terms of service is deliberately absent: it is fetched live from
 *  `/legal/documents/BUYER_TERMS` so the words shown are the exact ones a
 *  buyer accepts at checkout, and can never drift from the recorded version. */

export interface StaticSection {
  heading?: string;
  body?: string[];
  list?: string[];
}

export interface StaticPage {
  title: string;
  subtitle: string;
  sections: StaticSection[];
}

export const ABOUT_PAGE: StaticPage = {
  title: 'About JebDekho',
  subtitle: 'Compare Prices. Save More. Shop Smarter.',
  sections: [
    {
      body: [
        'JebDekho is a next-generation hyperlocal commerce platform that helps customers discover nearby stores, compare prices, and shop from trusted local merchants — all from one place.',
        "Our platform is designed to make everyday shopping more transparent, affordable, and convenient. Whether you're buying groceries, dairy products, fresh food, meat, electronics, personal care items, or daily essentials, JebDekho enables you to compare prices before making a purchase so you always get the best value.",
      ],
    },
    {
      heading: 'Our Vision',
      body: [
        "To become India's most trusted hyperlocal marketplace by empowering local businesses with digital technology while helping customers make smarter shopping decisions through price transparency and convenience.",
      ],
    },
    {
      heading: 'Our Mission',
      body: [
        'We believe neighbourhood businesses deserve the same digital opportunities as large retailers, and shoppers deserve complete pricing transparency before they buy.',
        'JebDekho bridges this gap by connecting buyers with verified local stores, enabling price comparison, faster deliveries, secure payments, and a seamless shopping experience.',
      ],
    },
    {
      heading: 'What We Offer',
      list: [
        'Compare prices across multiple nearby stores',
        'Hyperlocal delivery from trusted merchants',
        'Verified local seller network',
        'Cash on Delivery and secure online payments',
        'Real-time product availability',
        'Easy product discovery and smart search',
        'Multiple product categories in one platform',
        'Reliable customer support',
      ],
    },
    {
      heading: 'Why Choose JebDekho?',
      list: [
        'Save money by comparing prices before purchasing',
        'Support local businesses in your neighbourhood',
        'Quick delivery from nearby stores',
        'Trusted and verified merchant partners',
        'Transparent pricing with no hidden surprises',
        'Modern shopping experience built for everyday needs',
      ],
    },
    {
      heading: 'About UrbanMove Services Private Limited',
      body: [
        'JebDekho is proudly owned and operated by UrbanMove Services Private Limited, a technology company focused on building innovative digital platforms that simplify commerce and empower local businesses.',
        'UrbanMove Services Private Limited develops scalable technology solutions across e-commerce, marketplaces, logistics, and digital services with the vision of making everyday life easier through innovation and technology.',
      ],
    },
    {
      heading: 'Our Commitment',
      body: [
        'We are committed to building a trustworthy marketplace where customers can shop with confidence and local merchants can grow their businesses digitally. Every feature we build is focused on transparency, convenience, affordability, and delivering a better shopping experience.',
      ],
    },
  ],
};

export const PRIVACY_PAGE: StaticPage = {
  title: 'Privacy Policy',
  subtitle: 'Last updated: June 2026',
  sections: [
    {
      body: [
        'At JebDekho, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and safeguard your information when you use our website, mobile applications, and related services.',
        'JebDekho is owned and operated by UrbanMove Services Private Limited.',
      ],
    },
    {
      heading: '1. Information We Collect',
      list: [
        'Name, mobile number, and account details.',
        'Delivery addresses and saved locations.',
        'Order history and purchase information.',
        'Payment status and transaction details.',
        'Device information, browser type, and IP address.',
        'Location data (only with your permission).',
        'Customer support conversations and feedback.',
      ],
    },
    {
      heading: '2. How We Use Your Information',
      list: [
        'Process and deliver your orders.',
        'Show nearby stores and available products.',
        'Provide customer support.',
        'Send order confirmations and delivery updates.',
        'Detect fraud and improve platform security.',
        'Improve our products and services.',
        'Comply with legal and regulatory obligations.',
      ],
    },
    {
      heading: '3. Location Information',
      body: [
        'With your permission, we use your location to display nearby stores, estimate delivery times, and improve search accuracy. You can disable location access anytime through your device settings.',
      ],
    },
    {
      heading: '4. Payments',
      body: [
        'Online payments are securely processed through trusted payment partners. JebDekho does not store your complete credit card, debit card, or UPI credentials on its servers.',
      ],
    },
    {
      heading: '5. Information Sharing',
      body: ['We only share information when necessary, including:'],
      list: [
        'Verified merchants fulfilling your order.',
        'Delivery partners handling your shipment.',
        'Payment gateways for transaction processing.',
        'Government authorities when legally required.',
      ],
    },
    {
      body: ['We never sell your personal information.'],
    },
    {
      heading: '6. Cookies & Analytics',
      body: [
        'We use cookies and similar technologies to remember your preferences, improve website performance, analyze usage patterns, and enhance your shopping experience.',
      ],
    },
    {
      heading: '7. Data Security',
      body: [
        'We use industry-standard security measures including encryption, secure authentication, access controls, and continuous monitoring to help protect your personal information.',
      ],
    },
    {
      heading: '8. Data Retention',
      body: [
        'We retain your information only for as long as necessary to provide our services, comply with legal requirements, resolve disputes, and enforce our policies.',
      ],
    },
    {
      heading: '9. Your Rights',
      list: [
        'Access your personal information.',
        'Update or correct your information.',
        'Request deletion of your account where applicable.',
        'Withdraw permissions such as location access.',
        'Contact us regarding privacy concerns.',
      ],
    },
    {
      heading: "10. Children's Privacy",
      body: [
        'JebDekho is not intended for children under the age permitted by applicable law. We do not knowingly collect personal information from children.',
      ],
    },
    {
      heading: '11. Changes to This Policy',
      body: [
        'We may update this Privacy Policy from time to time. Any changes will be published on this page with an updated revision date.',
      ],
    },
    {
      heading: '12. Contact Us',
      body: [
        'If you have questions about this Privacy Policy or how your data is handled, please contact us at support@jebdekho.com.',
      ],
    },
  ],
};

export const REFUND_POLICY_PAGE: StaticPage = {
  title: 'Refund & Cancellation Policy',
  subtitle: 'Last updated: June 2026',
  sections: [
    {
      body: [
        'At JebDekho, customer satisfaction is our priority. This Refund & Cancellation Policy explains how cancellations, refunds, replacements, and returns are handled for orders placed through our platform.',
        'JebDekho is owned and operated by UrbanMove Services Private Limited.',
      ],
    },
    {
      heading: '1. Order Cancellation',
      body: [
        'Orders can generally be cancelled before the merchant starts preparing or processing them. Once preparation or dispatch has started, cancellation may no longer be available.',
      ],
      list: [
        'Open your Orders page.',
        'Select the order you wish to cancel.',
        'Choose Cancel Order if eligible.',
      ],
    },
    {
      heading: '2. Cancellation Eligibility',
      list: ['Order status.', 'Merchant acceptance.', 'Preparation stage.', 'Dispatch status.'],
    },
    {
      heading: '3. Refund Eligibility',
      body: ['Refunds may be approved if:'],
      list: [
        'The order is cancelled before fulfilment.',
        'The merchant cannot fulfil the order.',
        'You receive damaged products.',
        'You receive incorrect products.',
        'Items are missing from your order.',
        'Payment is successfully charged but the order fails.',
      ],
    },
    {
      heading: '4. Non-Refundable Products',
      body: [
        'Certain products may not be eligible for refunds or returns due to hygiene, food safety, or merchant-specific policies. These may include perishable goods, opened personal care products, and other restricted categories.',
      ],
    },
    {
      heading: '5. Damaged or Incorrect Products',
      body: [
        'If you receive damaged, expired, or incorrect products, please report the issue as soon as possible through Customer Support with clear photos and your order details. Eligible cases may receive a replacement, partial refund, or full refund after verification.',
      ],
    },
    {
      heading: '6. Missing Items',
      body: [
        'If any item is missing from your order, report it promptly through the Help Center or Contact Support. After verification with the merchant, the missing item may be delivered separately or refunded.',
      ],
    },
    {
      heading: '7. Replacement Policy',
      body: [
        'Depending on product availability and merchant approval, eligible items may be replaced instead of refunded.',
      ],
    },
    {
      heading: '8. Refund Timeline',
      list: [
        'UPI refunds: usually within 2–5 business days.',
        'Debit/Credit Card refunds: usually within 5–7 business days.',
        'Net Banking refunds: depending on your bank.',
        "Wallet refunds: as per the wallet provider's processing time.",
      ],
    },
    {
      heading: '9. Cash on Delivery (COD) Refunds',
      body: [
        'Refunds for Cash on Delivery orders may be processed through UPI, bank transfer, wallet credit, or another approved method after successful verification.',
      ],
    },
    {
      heading: '10. Merchant Verification',
      body: [
        'Every refund or replacement request is reviewed in coordination with the respective merchant before approval. Additional information or photos may be requested to complete the verification process.',
      ],
    },
    {
      heading: '11. Customer Responsibilities',
      list: [
        'Check your order at the time of delivery whenever possible.',
        'Report issues promptly.',
        'Provide accurate information and supporting photographs.',
        'Cooperate with our support team during verification.',
      ],
    },
    {
      heading: '12. Contact Support',
      body: [
        'For refund, cancellation, replacement, or return assistance, please contact our Customer Support team at support@jebdekho.com with your order number and a brief description of the issue.',
      ],
    },
  ],
};

export const DATA_DELETION_PAGE: StaticPage = {
  title: 'Data Deletion Instructions',
  subtitle: 'Last updated: July 2026',
  sections: [
    {
      body: [
        'This page explains how JebDekho users, buyers, merchants, delivery partners, and franchise partners can request deletion of their account and eligible personal data from JebDekho and related services.',
        'JebDekho is owned and operated by UrbanMove Services Private Limited.',
      ],
    },
    {
      heading: 'Who Can Request Data Deletion?',
      body: ['You may request deletion if you have used JebDekho as:'],
      list: [
        'A buyer or customer.',
        'A merchant, store owner, or seller partner.',
        'A delivery/rider partner.',
        'A franchise or business partner.',
        'A user who contacted JebDekho support.',
        'A user who interacted with JebDekho through WhatsApp, SMS, email, or push notifications.',
      ],
    },
    {
      heading: 'How to Request Deletion',
      list: [
        'Send an email to support@jebdekho.com from the email address linked to your JebDekho account.',
        'Use the subject line "Data Deletion Request".',
        'Include your registered mobile number, email address, and role on JebDekho, such as buyer, merchant, rider, or franchise partner.',
        'Clearly confirm that you want your JebDekho account and eligible personal data deleted.',
        'If your request relates to WhatsApp, include the WhatsApp phone number used with JebDekho.',
      ],
    },
    {
      heading: 'Information to Include',
      list: [
        'Full name.',
        'Registered mobile number.',
        'Registered email address.',
        'WhatsApp number, if different.',
        'Your account type: buyer, merchant, rider, franchise, or support user.',
        'Store name or business name, if you are a merchant.',
        'Any relevant order ID, ticket ID, or payment reference, if applicable.',
      ],
    },
    {
      heading: 'What We Delete',
      list: [
        'Account profile information.',
        'Saved addresses and contact details.',
        'Saved preferences, wishlist data, and notification preferences.',
        'WhatsApp-linked identifiers and messaging preferences.',
        'Support data that is no longer legally or operationally required.',
        'Inactive device tokens used for push notifications.',
        'Marketing communication preferences, where applicable.',
      ],
    },
    {
      heading: 'Merchant, Rider, and Partner Data',
      body: [
        'If you are a merchant, rider, franchise, or business partner, some business records may need to be retained for operational, contractual, tax, payment, compliance, fraud-prevention, and dispute-resolution purposes. Eligible personal or inactive account data will be deleted or deactivated after verification.',
      ],
    },
    {
      heading: 'WhatsApp Data',
      body: [
        'If you interacted with JebDekho through WhatsApp, we may process your WhatsApp phone number, message preferences, support messages, order updates, delivery updates, and communication logs. You can request deletion of eligible WhatsApp-linked data by mentioning your WhatsApp number in your deletion request.',
      ],
    },
    {
      heading: 'Data We May Retain',
      body: [
        'Some records may be retained where required by law, tax rules, fraud prevention, dispute resolution, payment reconciliation, merchant settlements, delivery reconciliation, legal claims, regulatory obligations, or platform security.',
        'This may include:',
      ],
      list: [
        'Order invoices and legally required transaction history.',
        'Payment, refund, settlement, wallet, and reconciliation records.',
        'Tax, GST, TDS/TCS, accounting, and audit records.',
        'Fraud-prevention, abuse-prevention, and security logs.',
        'Support tickets required for unresolved disputes.',
        'Merchant onboarding, KYC, business verification, and compliance records where retention is legally required.',
      ],
    },
    {
      heading: 'Account Deactivation vs Deletion',
      body: [
        'In some cases, we may first deactivate your account to prevent further login or transactions while we verify and process the deletion request. Once eligible data is deleted, some retained records may remain in a restricted form only for legally required purposes.',
      ],
    },
    {
      heading: 'Processing Timeline',
      body: [
        'We will acknowledge your request and process eligible deletion requests within 30 days. If additional verification is required, we may contact you before completing the request.',
      ],
    },
    {
      heading: 'Verification',
      body: [
        'To protect users from unauthorized deletion requests, we may verify your identity through your registered email, mobile number, OTP, support history, or business account details before processing the request.',
      ],
    },
    {
      heading: 'After Deletion',
      list: [
        'You may lose access to your JebDekho account.',
        'Saved addresses, preferences, and communication settings may be removed.',
        'Past orders may no longer appear in your account, except where legally retained records are required.',
        'Merchant, rider, or franchise access may be disabled after verification.',
      ],
    },
    {
      heading: 'Contact',
      body: ['For data deletion, privacy, or WhatsApp data concerns, contact support@jebdekho.com.'],
    },
  ],
};
