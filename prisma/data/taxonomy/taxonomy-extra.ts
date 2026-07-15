import type { TaxRoot } from './engine';

/**
 * Additional mass-market PRODUCT roots (catalogKind = PRODUCT) that a general
 * marketplace/quick-commerce launch needs beyond grocery/electronics/fashion.
 * All slugs are globally unique across the taxonomy definition.
 */
export const EXTRA_TAXONOMY: TaxRoot[] = [
  // ───────────────────────────────────────── HOME & KITCHEN ──────────────────
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    catalogKind: 'PRODUCT',
    children: [
      { name: 'Cookware', slug: 'cookware', children: [
        { name: 'Kadai & Pans', slug: 'kadai-pans' },
        { name: 'Pressure Cookers', slug: 'pressure-cookers' },
        { name: 'Tawa & Griddles', slug: 'tawa-griddles' },
        { name: 'Non-Stick Cookware', slug: 'non-stick-cookware' },
      ] },
      { name: 'Dinnerware & Serveware', slug: 'dinnerware-serveware', children: [
        { name: 'Plates & Thali', slug: 'plates-thali' },
        { name: 'Bowls & Katori', slug: 'bowls-katori' },
        { name: 'Glasses & Mugs', slug: 'glasses-mugs' },
        { name: 'Serving Dishes', slug: 'serving-dishes' },
      ] },
      { name: 'Kitchen Tools & Gadgets', slug: 'kitchen-tools-gadgets', children: [
        { name: 'Knives & Choppers', slug: 'knives-choppers' },
        { name: 'Graters & Peelers', slug: 'graters-peelers' },
        { name: 'Spatulas & Ladles', slug: 'spatulas-ladles' },
      ] },
      { name: 'Storage & Containers', slug: 'storage-containers', children: [
        { name: 'Airtight Containers', slug: 'airtight-containers' },
        { name: 'Water Bottles & Flasks', slug: 'water-bottles-flasks' },
        { name: 'Lunch Boxes & Tiffins', slug: 'lunch-boxes-tiffins' },
      ] },
      { name: 'Cleaning Tools', slug: 'cleaning-tools', children: [
        { name: 'Mops & Wipers', slug: 'mops-wipers' },
        { name: 'Brooms & Dustpans', slug: 'brooms-dustpans' },
        { name: 'Scrubbers & Sponges', slug: 'scrubbers-sponges' },
        { name: 'Buckets & Mugs', slug: 'buckets-mugs' },
      ] },
      { name: 'Home Decor', slug: 'home-decor', children: [
        { name: 'Wall Decor & Clocks', slug: 'wall-decor-clocks' },
        { name: 'Vases & Showpieces', slug: 'vases-showpieces' },
        { name: 'Artificial Plants', slug: 'artificial-plants' },
        { name: 'Photo Frames', slug: 'photo-frames' },
      ] },
      { name: 'Furnishing', slug: 'furnishing', children: [
        { name: 'Bedsheets & Covers', slug: 'bedsheets-covers' },
        { name: 'Curtains', slug: 'curtains' },
        { name: 'Cushions & Pillows', slug: 'cushions-pillows' },
        { name: 'Towels & Bath Linen', slug: 'towels-bath-linen' },
        { name: 'Doormats & Rugs', slug: 'doormats-rugs' },
      ] },
      { name: 'Lighting & Electricals', slug: 'lighting-electricals', children: [
        { name: 'LED Bulbs & Tubes', slug: 'led-bulbs-tubes' },
        { name: 'Decorative & String Lights', slug: 'decorative-string-lights' },
        { name: 'Switches & Sockets', slug: 'switches-sockets' },
        { name: 'Extension Cords', slug: 'home-extension-cords' },
      ] },
      { name: 'Pooja Needs', slug: 'pooja-needs', children: [
        { name: 'Agarbatti & Dhoop', slug: 'agarbatti-dhoop' },
        { name: 'Diyas & Camphor', slug: 'diyas-camphor' },
        { name: 'Pooja Thali & Idols', slug: 'pooja-thali-idols' },
      ] },
    ],
  },

  // ──────────────────────────────────────── SPORTS & FITNESS ─────────────────
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    catalogKind: 'PRODUCT',
    children: [
      { name: 'Gym Equipment', slug: 'gym-equipment', children: [
        { name: 'Dumbbells & Weights', slug: 'dumbbells-weights' },
        { name: 'Resistance Bands', slug: 'resistance-bands' },
        { name: 'Yoga Mats', slug: 'yoga-mats' },
        { name: 'Skipping Ropes', slug: 'skipping-ropes' },
        { name: 'Home Gym Machines', slug: 'home-gym-machines' },
      ] },
      { name: 'Fitness Accessories', slug: 'fitness-accessories', children: [
        { name: 'Gym Gloves & Belts', slug: 'gym-gloves-belts' },
        { name: 'Shakers & Bottles', slug: 'shakers-bottles' },
        { name: 'Fitness Trackers', slug: 'fitness-trackers-sport' },
      ] },
      { name: 'Sportswear', slug: 'sportswear', children: [
        { name: 'Track Pants & Shorts', slug: 'track-pants-shorts' },
        { name: 'Sports T-Shirts', slug: 'sports-tshirts' },
        { name: 'Sports Bras', slug: 'sports-bras' },
      ] },
      { name: 'Outdoor & Team Sports', slug: 'outdoor-team-sports', children: [
        { name: 'Cricket', slug: 'cricket' },
        { name: 'Football', slug: 'football' },
        { name: 'Badminton', slug: 'badminton' },
        { name: 'Cycling', slug: 'cycling' },
      ] },
    ],
  },

  // ──────────────────────────────── TOYS, GAMES & STATIONERY ──────────────────
  {
    name: 'Toys, Games & Stationery',
    slug: 'toys-games-stationery',
    catalogKind: 'PRODUCT',
    children: [
      { name: 'Toys', slug: 'toys', children: [
        { name: 'Soft Toys', slug: 'soft-toys' },
        { name: 'Building Blocks', slug: 'building-blocks' },
        { name: 'Remote Control Toys', slug: 'remote-control-toys' },
        { name: 'Educational Toys', slug: 'educational-toys' },
      ] },
      { name: 'Games & Puzzles', slug: 'games-puzzles', children: [
        { name: 'Board Games', slug: 'board-games' },
        { name: 'Puzzles', slug: 'puzzles' },
        { name: 'Card Games', slug: 'card-games' },
      ] },
      { name: 'Stationery', slug: 'stationery', children: [
        { name: 'Notebooks & Diaries', slug: 'notebooks-diaries' },
        { name: 'Pens & Pencils', slug: 'pens-pencils' },
        { name: 'Art & Craft', slug: 'art-craft' },
        { name: 'Files & Folders', slug: 'files-folders' },
        { name: 'Calculators', slug: 'calculators' },
      ] },
      { name: 'Books', slug: 'books', children: [
        { name: 'Academic & School', slug: 'academic-school-books' },
        { name: 'Fiction & Literature', slug: 'fiction-literature' },
        { name: 'Children Books', slug: 'children-books' },
        { name: 'Competitive Exams', slug: 'competitive-exams-books' },
      ] },
    ],
  },

  // ─────────────────────────────── AUTOMOTIVE & ACCESSORIES ───────────────────
  {
    name: 'Automotive & Accessories',
    slug: 'automotive-accessories',
    catalogKind: 'PRODUCT',
    children: [
      { name: 'Car Accessories', slug: 'car-accessories', children: [
        { name: 'Car Chargers & Mounts', slug: 'car-chargers-mounts' },
        { name: 'Seat Covers & Mats', slug: 'seat-covers-mats' },
        { name: 'Car Care & Cleaning', slug: 'car-care-cleaning' },
        { name: 'Air Fresheners', slug: 'car-air-fresheners' },
      ] },
      { name: 'Bike Accessories', slug: 'bike-accessories', children: [
        { name: 'Helmets', slug: 'helmets' },
        { name: 'Bike Covers & Locks', slug: 'bike-covers-locks' },
        { name: 'Riding Gloves', slug: 'riding-gloves' },
      ] },
      { name: 'Oils & Fluids', slug: 'oils-fluids', children: [
        { name: 'Engine Oil', slug: 'engine-oil' },
        { name: 'Coolants & Additives', slug: 'coolants-additives' },
      ] },
    ],
  },

  // ────────────────────────────────────── BEAUTY & MAKEUP ────────────────────
  {
    name: 'Beauty & Makeup',
    slug: 'beauty-makeup',
    catalogKind: 'PRODUCT',
    children: [
      { name: 'Face Makeup', slug: 'face-makeup', children: [
        { name: 'Foundation & BB Cream', slug: 'foundation-bb-cream' },
        { name: 'Compact & Powder', slug: 'compact-powder' },
        { name: 'Concealer & Primer', slug: 'concealer-primer' },
      ] },
      { name: 'Eye Makeup', slug: 'eye-makeup', children: [
        { name: 'Kajal & Eyeliner', slug: 'kajal-eyeliner' },
        { name: 'Mascara', slug: 'mascara' },
        { name: 'Eyeshadow', slug: 'eyeshadow' },
      ] },
      { name: 'Lip Makeup', slug: 'lip-makeup', children: [
        { name: 'Lipstick', slug: 'lipstick' },
        { name: 'Lip Gloss & Balm', slug: 'lip-gloss-balm' },
      ] },
      { name: 'Nail Care', slug: 'nail-care', children: [
        { name: 'Nail Polish', slug: 'nail-polish' },
        { name: 'Nail Tools', slug: 'nail-tools' },
      ] },
      { name: 'Beauty Tools & Accessories', slug: 'beauty-tools-accessories', children: [
        { name: 'Makeup Brushes', slug: 'makeup-brushes' },
        { name: 'Mirrors & Applicators', slug: 'mirrors-applicators' },
      ] },
    ],
  },
];
