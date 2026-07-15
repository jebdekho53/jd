import type { TaxRoot } from './engine';

/**
 * JebDekho GLOBAL PRODUCT taxonomy (catalogKind = PRODUCT).
 *
 * Rules honoured:
 *  - Existing categories are referenced by their EXACT current slug so the engine
 *    matches (never duplicates, never renames) them; new depth hangs beneath.
 *  - Every slug in this file is globally unique (asserted by the seed).
 *  - Collisions across roots are disambiguated with a parent-scoped prefix
 *    (e.g. grocery "snacks" → `grocery-snacks`, cafe already owns `cafe-snacks`).
 *
 * Depth: L1 root › L2 sub › L3 grand-sub › L4 product-type (where it adds value).
 */
export const PRODUCT_TAXONOMY: TaxRoot[] = [
  // ─────────────────────────────────────────── GROCERY ───────────────────────
  {
    name: 'Grocery',
    slug: 'grocery',
    catalogKind: 'PRODUCT',
    children: [
      {
        name: 'Fruits & Vegetables',
        slug: 'fruits-vegetables',
        children: [
          { name: 'Fresh Fruits', slug: 'fresh-fruits', children: [
            { name: 'Seasonal Fruits', slug: 'seasonal-fruits' },
            { name: 'Exotic Fruits', slug: 'exotic-fruits' },
            { name: 'Citrus Fruits', slug: 'citrus-fruits' },
            { name: 'Berries', slug: 'berries' },
          ] },
          { name: 'Fresh Vegetables', slug: 'fresh-vegetables', children: [
            { name: 'Leafy Vegetables', slug: 'leafy-vegetables' },
            { name: 'Root Vegetables', slug: 'root-vegetables' },
            { name: 'Gourd & Exotic', slug: 'gourd-exotic-vegetables' },
            { name: 'Cut & Sprouts', slug: 'cut-vegetables-sprouts' },
          ] },
          { name: 'Herbs & Seasonings', slug: 'herbs-seasonings' },
          { name: 'Organic Fruits & Vegetables', slug: 'organic-fruits-vegetables' },
        ],
      },
      {
        name: 'Staples',
        slug: 'grocery-staples',
        children: [
          { name: 'Atta, Flours & Sooji', slug: 'atta-flours-sooji' },
          { name: 'Rice & Rice Products', slug: 'rice-rice-products', children: [
            { name: 'Basmati Rice', slug: 'basmati-rice' },
            { name: 'Non-Basmati Rice', slug: 'non-basmati-rice' },
            { name: 'Poha & Flattened Rice', slug: 'poha-flattened-rice' },
          ] },
          { name: 'Dals & Pulses', slug: 'dals-pulses' },
          { name: 'Sugar, Jaggery & Salt', slug: 'sugar-jaggery-salt' },
          { name: 'Edible Oils & Ghee', slug: 'edible-oils-ghee', children: [
            { name: 'Refined & Sunflower Oil', slug: 'refined-sunflower-oil' },
            { name: 'Mustard Oil', slug: 'mustard-oil' },
            { name: 'Olive Oil', slug: 'olive-oil' },
            { name: 'Ghee & Vanaspati', slug: 'ghee-vanaspati' },
          ] },
          { name: 'Masalas & Spices', slug: 'masalas-spices', children: [
            { name: 'Whole Spices', slug: 'whole-spices' },
            { name: 'Powdered Spices', slug: 'powdered-spices' },
            { name: 'Blended Masalas', slug: 'blended-masalas' },
          ] },
          { name: 'Dry Fruits & Nuts', slug: 'dry-fruits-nuts' },
        ],
      },
      {
        name: 'Dairy & Bakery',
        slug: 'dairy-bakery',
        children: [
          { name: 'Milk & Milk Drinks', slug: 'milk-milk-drinks' },
          { name: 'Curd, Paneer & Cream', slug: 'curd-paneer-cream' },
          { name: 'Butter, Cheese & Ghee', slug: 'butter-cheese' },
          { name: 'Bread & Buns', slug: 'bread-buns' },
          { name: 'Eggs', slug: 'grocery-eggs' },
        ],
      },
      {
        name: 'Snacks & Branded Foods',
        slug: 'grocery-snacks',
        children: [
          { name: 'Chips & Namkeen', slug: 'chips-namkeen' },
          { name: 'Biscuits & Cookies', slug: 'biscuits-cookies' },
          { name: 'Chocolates & Candies', slug: 'chocolates-candies' },
          { name: 'Noodles, Pasta & Vermicelli', slug: 'noodles-pasta-vermicelli' },
          { name: 'Sauces, Ketchup & Spreads', slug: 'sauces-ketchup-spreads' },
          { name: 'Breakfast & Cereals', slug: 'breakfast-cereals' },
        ],
      },
      {
        name: 'Beverages',
        slug: 'grocery-beverages',
        children: [
          { name: 'Tea', slug: 'grocery-tea' },
          { name: 'Coffee', slug: 'grocery-coffee' },
          { name: 'Soft Drinks & Juices', slug: 'soft-drinks-juices' },
          { name: 'Health & Energy Drinks', slug: 'health-energy-drinks' },
          { name: 'Water & Soda', slug: 'water-soda' },
        ],
      },
      {
        name: 'Ready to Cook & Eat',
        slug: 'ready-to-cook-eat',
        children: [
          { name: 'Instant Mixes', slug: 'instant-mixes' },
          { name: 'Ready to Eat Meals', slug: 'ready-to-eat-meals' },
          { name: 'Frozen Food', slug: 'frozen-food' },
          { name: 'Pickles & Papad', slug: 'pickles-papad' },
        ],
      },
      {
        name: 'Household & Cleaning',
        slug: 'household-cleaning',
        children: [
          { name: 'Detergents & Fabric Care', slug: 'detergents-fabric-care' },
          { name: 'Dishwashing', slug: 'dishwashing' },
          { name: 'Floor & Surface Cleaners', slug: 'floor-surface-cleaners' },
          { name: 'Toilet & Bathroom Cleaners', slug: 'toilet-bathroom-cleaners' },
          { name: 'Fresheners & Repellents', slug: 'fresheners-repellents' },
          { name: 'Tissues, Foils & Disposables', slug: 'tissues-foils-disposables' },
        ],
      },
      {
        name: 'Baby Care',
        slug: 'grocery-baby-care',
        children: [
          { name: 'Diapers & Wipes', slug: 'diapers-wipes' },
          { name: 'Baby Food & Formula', slug: 'baby-food-formula' },
          { name: 'Baby Bath & Skin', slug: 'baby-bath-skin' },
        ],
      },
      {
        name: 'Pet Care',
        slug: 'pet-care',
        children: [
          { name: 'Dog Food & Supplies', slug: 'dog-food-supplies' },
          { name: 'Cat Food & Supplies', slug: 'cat-food-supplies' },
          { name: 'Pet Grooming & Accessories', slug: 'pet-grooming-accessories' },
        ],
      },
      {
        name: 'Organic & Gourmet',
        slug: 'organic-gourmet',
        children: [
          { name: 'Organic Staples', slug: 'organic-staples' },
          { name: 'Imported & Gourmet Food', slug: 'imported-gourmet-food' },
          { name: 'Regional Specialties', slug: 'regional-specialties' },
        ],
      },
    ],
  },

  // ───────────────────────────────────────── ELECTRONICS ─────────────────────
  {
    name: 'Electronics',
    slug: 'electronics',
    catalogKind: 'PRODUCT',
    children: [
      {
        name: 'Mobiles & Tablets',
        slug: 'mobiles-tablets',
        children: [
          { name: 'Smartphones', slug: 'smartphones' },
          { name: 'Feature Phones', slug: 'feature-phones' },
          { name: 'Tablets', slug: 'tablets' },
        ],
      },
      {
        name: 'Mobile Accessories',
        slug: 'mobile-accessories',
        children: [
          { name: 'Chargers & Adapters', slug: 'chargers-adapters' },
          { name: 'USB & Data Cables', slug: 'usb-data-cables' },
          { name: 'Power Banks', slug: 'power-banks' },
          { name: 'Mobile Covers & Cases', slug: 'mobile-covers-cases' },
          { name: 'Screen Guards', slug: 'screen-guards' },
          { name: 'Earphones & Headsets', slug: 'earphones-headsets' },
        ],
      },
      {
        name: 'Computers & Laptops',
        slug: 'computers-laptops',
        children: [
          { name: 'Laptops', slug: 'laptops' },
          { name: 'Desktops & Monitors', slug: 'desktops-monitors' },
          { name: 'Keyboards & Mice', slug: 'keyboards-mice' },
          { name: 'Printers & Ink', slug: 'printers-ink' },
          { name: 'Computer Components', slug: 'computer-components' },
        ],
      },
      {
        name: 'Audio',
        slug: 'audio',
        children: [
          { name: 'Headphones', slug: 'headphones' },
          { name: 'True Wireless Earbuds', slug: 'true-wireless-earbuds' },
          { name: 'Bluetooth Speakers', slug: 'bluetooth-speakers' },
          { name: 'Soundbars & Home Audio', slug: 'soundbars-home-audio' },
        ],
      },
      {
        name: 'Wearables',
        slug: 'wearables',
        children: [
          { name: 'Smartwatches', slug: 'smartwatches' },
          { name: 'Fitness Bands', slug: 'fitness-bands' },
        ],
      },
      {
        name: 'Smart Home',
        slug: 'smart-home',
        children: [
          { name: 'Smart Lighting', slug: 'smart-lighting' },
          { name: 'Smart Plugs & Switches', slug: 'smart-plugs-switches' },
          { name: 'Security Cameras', slug: 'security-cameras' },
        ],
      },
      {
        name: 'Home Appliances',
        slug: 'home-appliances',
        children: [
          { name: 'Kitchen Appliances', slug: 'kitchen-appliances' },
          { name: 'Fans & Coolers', slug: 'fans-coolers' },
          { name: 'Irons & Garment Care', slug: 'irons-garment-care' },
          { name: 'Large Appliances', slug: 'large-appliances' },
        ],
      },
      {
        name: 'Storage & Cables',
        slug: 'storage-cables',
        children: [
          { name: 'Pen Drives & Memory Cards', slug: 'pen-drives-memory-cards' },
          { name: 'External Hard Drives & SSD', slug: 'external-drives-ssd' },
          { name: 'Adapters & Hubs', slug: 'adapters-hubs' },
        ],
      },
      {
        name: 'Power & Accessories',
        slug: 'power-accessories',
        children: [
          { name: 'Batteries', slug: 'batteries' },
          { name: 'Extension Boards & Surge', slug: 'extension-boards-surge' },
          { name: 'Inverters & UPS', slug: 'inverters-ups' },
        ],
      },
      {
        name: 'Gaming',
        slug: 'gaming',
        children: [
          { name: 'Consoles', slug: 'gaming-consoles' },
          { name: 'Controllers & Accessories', slug: 'gaming-controllers-accessories' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────── HEALTH & NUTRITION ────────────────
  // Existing deep subtree (protein / vitamins / workout / wellness) is kept by
  // slug; new branches (Personal Care depth, Healthy Snacks, Diet Food) added.
  {
    name: 'Health & Nutrition',
    slug: 'health-nutrition',
    catalogKind: 'PRODUCT',
    children: [
      {
        name: 'Personal Care',
        slug: 'personal-care',
        children: [
          { name: 'Skin Care', slug: 'skin-care', children: [
            { name: 'Face Wash & Cleansers', slug: 'face-wash-cleansers' },
            { name: 'Moisturisers & Creams', slug: 'moisturisers-creams' },
            { name: 'Sunscreen', slug: 'sunscreen' },
            { name: 'Lip Care', slug: 'lip-care' },
          ] },
          { name: 'Hair Care', slug: 'hair-care', children: [
            { name: 'Shampoo & Conditioner', slug: 'shampoo-conditioner' },
            { name: 'Hair Oil', slug: 'hair-oil' },
            { name: 'Hair Colour', slug: 'hair-colour' },
            { name: 'Hair Serum & Styling', slug: 'hair-serum-styling' },
          ] },
          { name: 'Oral Care', slug: 'oral-care', children: [
            { name: 'Toothpaste', slug: 'toothpaste' },
            { name: 'Toothbrush', slug: 'toothbrush' },
            { name: 'Mouthwash', slug: 'mouthwash' },
          ] },
          { name: 'Bath & Body', slug: 'bath-body', children: [
            { name: 'Soaps & Body Wash', slug: 'soaps-body-wash' },
            { name: 'Deodorants & Talc', slug: 'deodorants-talc' },
            { name: 'Hand Wash & Sanitiser', slug: 'hand-wash-sanitiser' },
          ] },
          { name: "Men's Grooming", slug: 'mens-grooming', children: [
            { name: 'Shaving & Razors', slug: 'shaving-razors' },
            { name: 'Beard Care', slug: 'beard-care' },
          ] },
          { name: 'Feminine Hygiene', slug: 'feminine-hygiene' },
          { name: 'Fragrance', slug: 'fragrance' },
          { name: 'Cosmetics & Makeup', slug: 'cosmetics-makeup' },
          { name: 'Health Devices', slug: 'health-devices' },
        ],
      },
      {
        name: 'Protein & Gym Supplements',
        slug: 'protein-gym-supplements',
        children: [
          { name: 'Whey Protein', slug: 'whey-protein' },
          { name: 'Whey Isolate', slug: 'whey-isolate' },
          { name: 'Mass Gainer', slug: 'mass-gainer' },
          { name: 'Weight Gainer', slug: 'weight-gainer' },
          { name: 'Plant Protein', slug: 'plant-protein' },
          { name: 'Soy Protein', slug: 'soy-protein' },
          { name: 'Protein Bars', slug: 'protein-bars' },
          { name: 'Protein Cookies', slug: 'protein-cookies' },
        ],
      },
      {
        name: 'Workout Performance',
        slug: 'workout-performance',
        children: [
          { name: 'Pre-Workout', slug: 'pre-workout' },
          { name: 'Post-Workout', slug: 'post-workout' },
          { name: 'Creatine', slug: 'creatine' },
          { name: 'BCAA', slug: 'bcaa' },
          { name: 'EAA', slug: 'eaa' },
          { name: 'Glutamine', slug: 'glutamine' },
          { name: 'L-Carnitine', slug: 'l-carnitine' },
          { name: 'Electrolytes', slug: 'electrolytes' },
        ],
      },
      {
        name: 'Vitamins & Daily Health',
        slug: 'vitamins-daily-health',
        children: [
          { name: 'Multivitamins', slug: 'multivitamins' },
          { name: 'Vitamin C', slug: 'vitamin-c' },
          { name: 'Vitamin D', slug: 'vitamin-d' },
          { name: 'Calcium', slug: 'calcium' },
          { name: 'Iron', slug: 'iron' },
          { name: 'Zinc', slug: 'zinc' },
          { name: 'Magnesium', slug: 'magnesium' },
          { name: 'Omega-3 / Fish Oil', slug: 'omega-3-fish-oil' },
        ],
      },
      {
        name: 'Wellness / Lifestyle',
        slug: 'wellness-lifestyle',
        children: [
          { name: 'Immunity Boosters', slug: 'immunity-boosters' },
          { name: 'Digestive Health', slug: 'digestive-health' },
          { name: 'Probiotics', slug: 'probiotics' },
          { name: 'Ayurveda Wellness', slug: 'ayurveda-wellness' },
          { name: 'Herbal Supplements', slug: 'herbal-supplements' },
          { name: 'Weight Management', slug: 'weight-management' },
          { name: 'Immunity & Energy Drinks', slug: 'energy-drinks' },
          { name: 'ORS / Hydration', slug: 'ors-hydration' },
        ],
      },
      {
        name: 'Healthy Foods',
        slug: 'healthy-foods',
        children: [
          { name: 'Healthy Snacks', slug: 'healthy-snacks' },
          { name: 'Diet & Keto Food', slug: 'diet-keto-food' },
          { name: 'Peanut Butter & Spreads', slug: 'peanut-butter-spreads' },
          { name: 'Seeds & Trail Mixes', slug: 'seeds-trail-mixes' },
        ],
      },
      { name: 'Supplements', slug: 'supplements' },
    ],
  },

  // ────────────────────────────────────────── FASHION ────────────────────────
  {
    name: 'Fashion',
    slug: 'fashion',
    catalogKind: 'PRODUCT',
    children: [
      {
        name: "Men's Clothing",
        slug: 'mens-clothing',
        children: [
          { name: 'T-Shirts & Polos', slug: 'mens-tshirts-polos' },
          { name: 'Shirts', slug: 'mens-shirts' },
          { name: 'Jeans & Trousers', slug: 'mens-jeans-trousers' },
          { name: 'Winterwear', slug: 'mens-winterwear' },
          { name: 'Innerwear', slug: 'mens-innerwear' },
        ],
      },
      {
        name: "Women's Clothing",
        slug: 'womens-clothing',
        children: [
          { name: 'Tops & T-Shirts', slug: 'womens-tops-tshirts' },
          { name: 'Dresses & Jumpsuits', slug: 'womens-dresses-jumpsuits' },
          { name: 'Jeans & Bottoms', slug: 'womens-jeans-bottoms' },
          { name: 'Winterwear', slug: 'womens-winterwear' },
          { name: 'Lingerie & Innerwear', slug: 'womens-innerwear' },
        ],
      },
      {
        name: 'Ethnic Wear',
        slug: 'ethnic-wear',
        children: [
          { name: 'Sarees', slug: 'sarees' },
          { name: 'Kurtas & Kurtis', slug: 'kurtas-kurtis' },
          { name: 'Salwar & Suits', slug: 'salwar-suits' },
          { name: 'Sherwani & Ethnic Men', slug: 'sherwani-ethnic-men' },
        ],
      },
      {
        name: "Kids' Wear",
        slug: 'kids-wear',
        children: [
          { name: 'Boys Clothing', slug: 'boys-clothing' },
          { name: 'Girls Clothing', slug: 'girls-clothing' },
          { name: 'Infants', slug: 'infants-clothing' },
        ],
      },
    ],
  },

  // ──────────────────────────────── FOOTWEAR & ACCESSORIES ────────────────────
  {
    name: 'Footwear & Accessories',
    slug: 'footwear-accessories',
    catalogKind: 'PRODUCT',
    children: [
      {
        name: 'Footwear',
        slug: 'footwear',
        children: [
          { name: "Men's Footwear", slug: 'mens-footwear' },
          { name: "Women's Footwear", slug: 'womens-footwear' },
          { name: 'Sports Shoes', slug: 'sports-shoes' },
          { name: 'Slippers & Flip-Flops', slug: 'slippers-flip-flops' },
        ],
      },
      {
        name: 'Bags',
        slug: 'bags',
        children: [
          { name: 'Backpacks', slug: 'backpacks' },
          { name: 'Handbags & Clutches', slug: 'handbags-clutches' },
          { name: 'Luggage & Trolleys', slug: 'luggage-trolleys' },
        ],
      },
      {
        name: 'Watches',
        slug: 'watches',
        children: [
          { name: 'Analog Watches', slug: 'analog-watches' },
          { name: 'Digital Watches', slug: 'digital-watches' },
        ],
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        children: [
          { name: 'Belts & Wallets', slug: 'belts-wallets' },
          { name: 'Sunglasses', slug: 'sunglasses' },
          { name: 'Caps & Hats', slug: 'caps-hats' },
          { name: 'Jewellery', slug: 'jewellery' },
        ],
      },
    ],
  },
];
