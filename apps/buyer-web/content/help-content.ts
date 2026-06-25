export const FAQ_ITEMS = [
  {
    q: 'How does JebDekho price comparison work?',
    a: 'We search products across nearby stores and show you the best price, savings, and store options so you can choose before you buy.',
    category: 'general',
  },
  {
    q: 'How do I place an order?',
    a: 'Browse stores or search products, add items to your cart, and proceed to checkout. You can pay online via Razorpay or choose Cash on Delivery where available.',
    category: 'orders',
  },
  {
    q: 'How do I track my order?',
    a: 'Go to Orders in your profile to see live status updates for all your orders.',
    category: 'orders',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We support UPI, cards, net banking via Razorpay, and Cash on Delivery (COD) at participating stores.',
    category: 'payment',
  },
  {
    q: 'How do refunds work?',
    a: 'If an order is cancelled or eligible for refund, the amount is returned to your original payment method within 5–7 business days. COD orders are refunded via UPI or store credit.',
    category: 'refund',
  },
  {
    q: 'What are delivery times?',
    a: 'Delivery times vary by store and location. Most nearby stores deliver within 30–60 minutes. ETA is shown on each store card.',
    category: 'delivery',
  },
  {
    q: 'Can I change my delivery address?',
    a: 'Yes. Add and manage saved addresses in Profile → Saved addresses before checkout.',
    category: 'delivery',
  },
  {
    q: 'How do I contact support?',
    a: 'Email us at support@jebdekho.com or use the Contact page. We typically respond within 24 hours.',
    category: 'general',
  },
] as const;

export const HELP_SECTIONS = [
  { id: 'orders', title: 'Orders', description: 'Track, cancel, and manage orders' },
  { id: 'payment', title: 'Payments', description: 'Payment methods and issues' },
  { id: 'refund', title: 'Refunds', description: 'Refund eligibility and timelines' },
  { id: 'delivery', title: 'Delivery', description: 'Delivery areas and timing' },
  { id: 'general', title: 'General', description: 'About JebDekho and how it works' },
] as const;
