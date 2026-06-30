export const FAQ_ITEMS = [
  {
    q: 'What is JebDekho?',
    a: 'JebDekho is a hyperlocal marketplace that helps you compare prices across nearby stores and order products from trusted local merchants.',
    category: 'general',
  },
  {
    q: 'Who owns JebDekho?',
    a: 'JebDekho is owned and operated by UrbanMove Services Private Limited.',
    category: 'general',
  },
  {
    q: 'How does JebDekho price comparison work?',
    a: 'JebDekho shows prices from nearby stores so you can compare options, check savings, and choose the best deal before placing your order.',
    category: 'general',
  },
  {
    q: 'Are all stores on JebDekho verified?',
    a: 'Yes. Merchants go through a verification process before they can sell on JebDekho.',
    category: 'general',
  },
  {
    q: 'Which products can I buy on JebDekho?',
    a: 'You can shop groceries, dairy, bakery, meat, fish, eggs, electronics, mobile accessories, personal care, health products, fresh food, and daily essentials.',
    category: 'general',
  },
  {
    q: 'How do I place an order?',
    a: 'Search for products or browse nearby stores, add items to your cart, choose your address and payment method, then confirm your order.',
    category: 'orders',
  },
  {
    q: 'How do I track my order?',
    a: 'Go to Orders in your profile to view the latest status of your order.',
    category: 'orders',
  },
  {
    q: 'Can I cancel my order?',
    a: 'You can cancel your order before the merchant starts processing it. Once processing or delivery has started, cancellation may not be available.',
    category: 'orders',
  },
  {
    q: 'Why was my order cancelled?',
    a: 'An order may be cancelled if items are unavailable, the merchant cannot fulfil it, payment fails, or delivery is not possible at your location.',
    category: 'orders',
  },
  {
    q: 'Can I order from multiple stores?',
    a: 'You can browse and compare multiple stores. Checkout rules may vary depending on store availability, delivery area, and cart conditions.',
    category: 'orders',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'JebDekho supports UPI, cards, net banking, wallets through Razorpay, and Cash on Delivery where available.',
    category: 'payment',
  },
  {
    q: 'Is Cash on Delivery available?',
    a: 'Yes. Cash on Delivery is available for eligible orders and participating stores.',
    category: 'payment',
  },
  {
    q: 'What should I do if my payment fails?',
    a: 'If payment fails but money is deducted, it is usually reversed by your bank or payment provider. You can also contact JebDekho support with your order details.',
    category: 'payment',
  },
  {
    q: 'Are online payments secure?',
    a: 'Yes. Online payments are processed through trusted payment partners such as Razorpay. JebDekho does not store your full card or banking details.',
    category: 'payment',
  },
  {
    q: 'How do refunds work?',
    a: 'Approved refunds are processed to the original payment method where possible. COD refunds may be handled through UPI, wallet, or store credit depending on the case.',
    category: 'refund',
  },
  {
    q: 'How long does a refund take?',
    a: 'Refund timelines depend on the payment method and bank. Most eligible refunds are processed within 5–7 business days after approval.',
    category: 'refund',
  },
  {
    q: 'Can I return products?',
    a: 'Return eligibility depends on the product category, merchant policy, and condition of the item. Perishable items may not be returnable once delivered.',
    category: 'refund',
  },
  {
    q: 'What if I receive a damaged product?',
    a: 'If you receive a damaged product, contact support with photos and order details as soon as possible. Eligible cases may qualify for replacement, refund, or store credit.',
    category: 'refund',
  },
  {
    q: 'What if an item is missing from my order?',
    a: 'If an item is missing, contact support with your order details. After verification, we will help with refund, replacement, or resolution.',
    category: 'refund',
  },
  {
    q: 'What are delivery times?',
    a: 'Delivery time depends on store distance, order volume, product availability, and location. Estimated delivery time is shown during checkout where available.',
    category: 'delivery',
  },
  {
    q: 'Is there a delivery charge?',
    a: 'Delivery charges may vary based on store, distance, order value, and applicable offers. Any delivery fee is shown before checkout.',
    category: 'delivery',
  },
  {
    q: 'Can I change my delivery address?',
    a: 'You can add or update addresses before placing an order. After order confirmation, address changes may not always be possible.',
    category: 'delivery',
  },
  {
    q: 'What if delivery is delayed?',
    a: 'Delivery can be delayed due to traffic, weather, store preparation time, or high demand. You can track your order status or contact support for help.',
    category: 'delivery',
  },
  {
    q: 'Why do prices differ between stores?',
    a: 'Each merchant sets their own product prices, offers, and discounts. JebDekho helps you compare these prices transparently.',
    category: 'general',
  },
  {
    q: 'Can prices change after I add items to cart?',
    a: 'Prices may change if a merchant updates pricing or offers before checkout. The final payable amount is shown before you place the order.',
    category: 'general',
  },
  {
    q: 'How do I contact support?',
    a: 'You can contact JebDekho through the Help Center or Contact page for order, payment, refund, delivery, or account-related help.',
    category: 'general',
  },
  {
    q: 'How can merchants join JebDekho?',
    a: 'Local merchants can contact JebDekho through the merchant onboarding or contact page to register their store and start selling online.',
    category: 'general',
  },
] as const;

export const HELP_SECTIONS = [
  {
    id: 'orders',
    title: 'Orders',
    description: 'Track, cancel, and manage your orders',
  },
  {
    id: 'payment',
    title: 'Payments',
    description: 'Online payments, COD, payment failures, and billing',
  },
  {
    id: 'refund',
    title: 'Refunds & Returns',
    description: 'Refund eligibility, timelines, returns, replacements, and missing items',
  },
  {
    id: 'delivery',
    title: 'Delivery',
    description: 'Delivery areas, charges, address changes, and delivery timing',
  },
  {
    id: 'general',
    title: 'General',
    description: 'About JebDekho, price comparison, nearby stores, and merchant support',
  },
] as const;