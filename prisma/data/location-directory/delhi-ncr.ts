/**
 * Delhi NCR Master Location Directory — official India Post pincode records.
 * Each entry maps State → District → City → Area → Pincode with coordinates.
 */

export interface DirectoryPincode {
  pincode: string;
  postOffice: string;
  subArea?: string;
  lat: number;
  lng: number;
}

export interface DirectoryArea {
  name: string;
  slug?: string;
  subArea?: string;
  lat?: number;
  lng?: number;
  aliases?: string[];
  pincodes: DirectoryPincode[];
}

export interface DirectoryCity {
  name: string;
  slug: string;
  districtSlug: string;
  stateCode: string;
  lat?: number;
  lng?: number;
  aliases?: string[];
  operationalCitySlug?: string;
  areas: DirectoryArea[];
}

export interface DirectoryDistrict {
  name: string;
  slug: string;
  stateCode: string;
}

export interface DirectoryState {
  code: string;
  name: string;
}

export const DIRECTORY_STATES: DirectoryState[] = [
  { code: 'DL', name: 'Delhi' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'HR', name: 'Haryana' },
];

export const DIRECTORY_DISTRICTS: DirectoryDistrict[] = [
  { slug: 'new-delhi', name: 'New Delhi', stateCode: 'DL' },
  { slug: 'central-delhi', name: 'Central Delhi', stateCode: 'DL' },
  { slug: 'north-delhi', name: 'North Delhi', stateCode: 'DL' },
  { slug: 'south-delhi', name: 'South Delhi', stateCode: 'DL' },
  { slug: 'east-delhi', name: 'East Delhi', stateCode: 'DL' },
  { slug: 'west-delhi', name: 'West Delhi', stateCode: 'DL' },
  { slug: 'north-west-delhi', name: 'North West Delhi', stateCode: 'DL' },
  { slug: 'north-east-delhi', name: 'North East Delhi', stateCode: 'DL' },
  { slug: 'south-east-delhi', name: 'South East Delhi', stateCode: 'DL' },
  { slug: 'south-west-delhi', name: 'South West Delhi', stateCode: 'DL' },
  { slug: 'shahdara', name: 'Shahdara', stateCode: 'DL' },
  { slug: 'gautam-buddha-nagar', name: 'Gautam Buddha Nagar', stateCode: 'UP' },
  { slug: 'ghaziabad', name: 'Ghaziabad', stateCode: 'UP' },
  { slug: 'gurugram', name: 'Gurugram', stateCode: 'HR' },
  { slug: 'faridabad', name: 'Faridabad', stateCode: 'HR' },
  { slug: 'sonipat', name: 'Sonipat', stateCode: 'HR' },
  { slug: 'jhajjar', name: 'Jhajjar', stateCode: 'HR' },
];

function po(
  pincode: string,
  postOffice: string,
  lat: number,
  lng: number,
  subArea?: string,
): DirectoryPincode {
  return { pincode, postOffice, lat, lng, subArea };
}

export const DIRECTORY_CITIES: DirectoryCity[] = [
  // ── Delhi districts ───────────────────────────────────────────────────────
  {
    name: 'New Delhi',
    slug: 'new-delhi',
    districtSlug: 'new-delhi',
    stateCode: 'DL',
    lat: 28.6139,
    lng: 77.209,
    aliases: ['NDMC', 'Lutyens Delhi'],
    areas: [
      {
        name: 'Connaught Place',
        aliases: ['CP', 'Rajiv Chowk'],
        pincodes: [po('110001', 'Connaught Place', 28.6315, 77.2167)],
      },
      {
        name: 'Parliament Street',
        pincodes: [po('110001', 'Parliament Street', 28.6172, 77.2082)],
      },
      {
        name: 'Chanakyapuri',
        pincodes: [po('110021', 'Chanakyapuri', 28.5892, 77.1889)],
      },
      {
        name: 'India Gate',
        pincodes: [po('110003', 'India Gate', 28.6129, 77.2295)],
      },
      {
        name: 'Lodhi Road',
        pincodes: [po('110003', 'Lodhi Road', 28.5918, 77.2273)],
      },
      {
        name: 'R K Puram',
        aliases: ['RK Puram'],
        pincodes: [po('110022', 'R K Puram', 28.5644, 77.1753)],
      },
      {
        name: 'Sarojini Nagar',
        pincodes: [po('110023', 'Sarojini Nagar', 28.575, 77.1992)],
      },
      {
        name: 'Hauz Khas',
        pincodes: [po('110016', 'Hauz Khas', 28.5494, 77.1855)],
      },
    ],
  },
  {
    name: 'Central Delhi',
    slug: 'central-delhi',
    districtSlug: 'central-delhi',
    stateCode: 'DL',
    lat: 28.6519,
    lng: 77.2315,
    areas: [
      {
        name: 'Daryaganj',
        pincodes: [po('110002', 'Daryaganj', 28.6415, 77.2405)],
      },
      {
        name: 'Paharganj',
        pincodes: [po('110055', 'Paharganj', 28.6423, 77.2147)],
      },
      {
        name: 'Karol Bagh',
        pincodes: [po('110005', 'Karol Bagh', 28.6512, 77.191)],
      },
      {
        name: 'Rajinder Nagar',
        pincodes: [po('110060', 'Rajinder Nagar', 28.6431, 77.1856)],
      },
      {
        name: 'Patel Nagar',
        pincodes: [po('110008', 'Patel Nagar', 28.6458, 77.1682)],
      },
    ],
  },
  {
    name: 'North Delhi',
    slug: 'north-delhi',
    districtSlug: 'north-delhi',
    stateCode: 'DL',
    lat: 28.7041,
    lng: 77.1025,
    areas: [
      {
        name: 'Civil Lines',
        pincodes: [po('110054', 'Civil Lines', 28.6806, 77.2228)],
      },
      {
        name: 'Kamla Nagar',
        pincodes: [po('110007', 'Kamla Nagar', 28.6828, 77.2067)],
      },
      {
        name: 'Model Town',
        pincodes: [po('110009', 'Model Town', 28.7041, 77.193)],
      },
      {
        name: 'Rohini',
        aliases: ['Rohini Sector 7', 'Rohini Sector 8'],
        pincodes: [
          po('110085', 'Rohini Sector 7', 28.7041, 77.1025),
          po('110085', 'Rohini Sector 8', 28.6989, 77.1089),
          po('110086', 'Rohini Sector 15', 28.7392, 77.1145),
        ],
      },
      {
        name: 'Pitampura',
        pincodes: [po('110034', 'Pitampura', 28.7041, 77.1315)],
      },
      {
        name: 'Burari',
        pincodes: [po('110084', 'Burari', 28.75, 77.2)],
      },
    ],
  },
  {
    name: 'South Delhi',
    slug: 'south-delhi',
    districtSlug: 'south-delhi',
    stateCode: 'DL',
    lat: 28.5244,
    lng: 77.2066,
    areas: [
      {
        name: 'Saket',
        pincodes: [po('110017', 'Saket', 28.5244, 77.2066)],
      },
      {
        name: 'Greater Kailash',
        aliases: ['GK', 'GK-1', 'GK-2'],
        pincodes: [
          po('110048', 'Greater Kailash', 28.5494, 77.2433),
          po('110048', 'Greater Kailash Part 1', 28.5512, 77.2411),
        ],
      },
      {
        name: 'Lajpat Nagar',
        pincodes: [po('110024', 'Lajpat Nagar', 28.5672, 77.2435)],
      },
      {
        name: 'Defence Colony',
        pincodes: [po('110024', 'Defence Colony', 28.5733, 77.2311)],
      },
      {
        name: 'Green Park',
        pincodes: [po('110016', 'Green Park', 28.5599, 77.2069)],
      },
      {
        name: 'Malviya Nagar',
        pincodes: [po('110017', 'Malviya Nagar', 28.5355, 77.211)],
      },
      {
        name: 'Vasant Kunj',
        pincodes: [po('110070', 'Vasant Kunj', 28.5244, 77.1588)],
      },
      {
        name: 'Chittaranjan Park',
        aliases: ['CR Park'],
        pincodes: [po('110019', 'Chittaranjan Park', 28.5389, 77.2456)],
      },
    ],
  },
  {
    name: 'East Delhi',
    slug: 'east-delhi',
    districtSlug: 'east-delhi',
    stateCode: 'DL',
    lat: 28.6279,
    lng: 77.2952,
    areas: [
      {
        name: 'Laxmi Nagar',
        aliases: ['Laxmi Nagar East Delhi'],
        pincodes: [po('110092', 'Laxmi Nagar', 28.6358, 77.2775)],
      },
      {
        name: 'Preet Vihar',
        pincodes: [po('110092', 'Preet Vihar', 28.6414, 77.2952)],
      },
      {
        name: 'Mayur Vihar',
        aliases: ['Mayur Vihar Phase 1', 'Mayur Vihar Phase 2', 'Mayur Vihar Phase 3'],
        pincodes: [
          po('110091', 'Mayur Vihar Phase 1', 28.6092, 77.2952),
          po('110091', 'Mayur Vihar Phase 2', 28.6156, 77.3011),
          po('110096', 'Mayur Vihar Phase 3', 28.5933, 77.3122),
        ],
      },
      {
        name: 'Patparganj',
        pincodes: [po('110092', 'Patparganj', 28.6222, 77.2856)],
      },
      {
        name: 'Anand Vihar',
        pincodes: [po('110092', 'Anand Vihar', 28.6469, 77.3164)],
      },
    ],
  },
  {
    name: 'West Delhi',
    slug: 'west-delhi',
    districtSlug: 'west-delhi',
    stateCode: 'DL',
    lat: 28.6517,
    lng: 77.1025,
    areas: [
      {
        name: 'Rajouri Garden',
        pincodes: [po('110027', 'Rajouri Garden', 28.6418, 77.1215)],
      },
      {
        name: 'Janakpuri',
        pincodes: [po('110058', 'Janakpuri', 28.6219, 77.0878)],
      },
      {
        name: 'Vikaspuri',
        pincodes: [po('110018', 'Vikaspuri', 28.6392, 77.0756)],
      },
      {
        name: 'Paschim Vihar',
        pincodes: [po('110063', 'Paschim Vihar', 28.6692, 77.1025)],
      },
      {
        name: 'Punjabi Bagh',
        pincodes: [po('110026', 'Punjabi Bagh', 28.6692, 77.1411)],
      },
    ],
  },
  {
    name: 'North West Delhi',
    slug: 'north-west-delhi',
    districtSlug: 'north-west-delhi',
    stateCode: 'DL',
    lat: 28.7286,
    lng: 77.1025,
    areas: [
      {
        name: 'Shalimar Bagh',
        pincodes: [po('110088', 'Shalimar Bagh', 28.7286, 77.1633)],
      },
      {
        name: 'Ashok Vihar',
        pincodes: [po('110052', 'Ashok Vihar', 28.6956, 77.1756)],
      },
      {
        name: 'Kirti Nagar',
        pincodes: [po('110015', 'Kirti Nagar', 28.6556, 77.1411)],
      },
      {
        name: 'Nangloi',
        pincodes: [po('110041', 'Nangloi', 28.6792, 77.0633)],
      },
    ],
  },
  {
    name: 'North East Delhi',
    slug: 'north-east-delhi',
    districtSlug: 'north-east-delhi',
    stateCode: 'DL',
    lat: 28.7041,
    lng: 77.2589,
    areas: [
      {
        name: 'Seelampur',
        pincodes: [po('110053', 'Seelampur', 28.6711, 77.2589)],
      },
      {
        name: 'Yamuna Vihar',
        pincodes: [po('110053', 'Yamuna Vihar', 28.7041, 77.2952)],
      },
      {
        name: 'Gokalpuri',
        pincodes: [po('110094', 'Gokalpuri', 28.7041, 77.3122)],
      },
    ],
  },
  {
    name: 'South East Delhi',
    slug: 'south-east-delhi',
    districtSlug: 'south-east-delhi',
    stateCode: 'DL',
    lat: 28.5562,
    lng: 77.2589,
    areas: [
      {
        name: 'Okhla',
        aliases: ['Okhla Phase 1', 'Okhla Phase 2', 'Okhla Phase 3'],
        pincodes: [
          po('110020', 'Okhla Phase 1', 28.5562, 77.2733),
          po('110020', 'Okhla Phase 2', 28.5489, 77.2689),
          po('110020', 'Okhla Phase 3', 28.5411, 77.2633),
        ],
      },
      {
        name: 'Jangpura',
        pincodes: [po('110014', 'Jangpura', 28.5811, 77.2411)],
      },
      {
        name: 'Kalkaji',
        pincodes: [po('110019', 'Kalkaji', 28.5494, 77.2589)],
      },
      {
        name: 'Nehru Place',
        pincodes: [po('110019', 'Nehru Place', 28.5494, 77.2511)],
      },
    ],
  },
  {
    name: 'South West Delhi',
    slug: 'south-west-delhi',
    districtSlug: 'south-west-delhi',
    stateCode: 'DL',
    lat: 28.5921,
    lng: 77.046,
    areas: [
      {
        name: 'Dwarka',
        aliases: ['Dwarka Sector 10', 'Dwarka Sector 12', 'Dwarka Sector 21'],
        pincodes: [
          po('110075', 'Dwarka Sector 10', 28.5921, 77.046),
          po('110078', 'Dwarka Sector 12', 28.5989, 77.0333),
          po('110077', 'Dwarka Sector 21', 28.5562, 77.0589),
        ],
      },
      {
        name: 'Najafgarh',
        pincodes: [po('110043', 'Najafgarh', 28.6092, 76.9856)],
      },
      {
        name: 'Palam',
        pincodes: [po('110045', 'Palam', 28.5921, 77.0811)],
      },
    ],
  },
  {
    name: 'Shahdara',
    slug: 'shahdara',
    districtSlug: 'shahdara',
    stateCode: 'DL',
    lat: 28.6711,
    lng: 77.2952,
    areas: [
      {
        name: 'Shahdara',
        pincodes: [po('110032', 'Shahdara', 28.6711, 77.2952)],
      },
      {
        name: 'Dilshad Garden',
        pincodes: [po('110095', 'Dilshad Garden', 28.6811, 77.3122)],
      },
      {
        name: 'Vivek Vihar',
        pincodes: [po('110095', 'Vivek Vihar', 28.6711, 77.3122)],
      },
    ],
  },

  // ── NCR — Uttar Pradesh ───────────────────────────────────────────────────
  {
    name: 'Noida',
    slug: 'noida',
    districtSlug: 'gautam-buddha-nagar',
    stateCode: 'UP',
    lat: 28.5355,
    lng: 77.391,
    aliases: ['New Okhla Industrial Development Authority'],
    areas: [
      {
        name: 'Sector 18',
        aliases: ['Sector 18 Noida'],
        pincodes: [po('201301', 'Sector 18 Noida', 28.5708, 77.3219)],
      },
      {
        name: 'Sector 62',
        aliases: ['Sector 62 Noida'],
        pincodes: [po('201309', 'Sector 62 Noida', 28.627, 77.373)],
      },
      {
        name: 'Sector 50',
        pincodes: [po('201301', 'Sector 50 Noida', 28.5744, 77.3567)],
      },
      {
        name: 'Sector 137',
        pincodes: [po('201305', 'Sector 137 Noida', 28.5009, 77.3865)],
      },
      {
        name: 'Sector 15',
        pincodes: [po('201301', 'Sector 15 Noida', 28.5856, 77.3111)],
      },
      {
        name: 'Sector 76',
        pincodes: [po('201301', 'Sector 76 Noida', 28.5744, 77.3811)],
      },
      {
        name: 'Noida Extension',
        aliases: ['Noida Ext', 'Greater Noida West'],
        pincodes: [
          po('201306', 'Noida Extension', 28.5355, 77.391),
          po('201009', 'Gaur City Noida Extension', 28.6092, 77.4211),
        ],
      },
    ],
  },
  {
    name: 'Greater Noida',
    slug: 'greater-noida',
    districtSlug: 'gautam-buddha-nagar',
    stateCode: 'UP',
    lat: 28.4744,
    lng: 77.504,
    aliases: ['Greater Noida City'],
    areas: [
      {
        name: 'Alpha 1',
        pincodes: [po('201310', 'Alpha 1 Greater Noida', 28.4744, 77.504)],
      },
      {
        name: 'Beta 1',
        pincodes: [po('201310', 'Beta 1 Greater Noida', 28.4689, 77.5089)],
      },
      {
        name: 'Pari Chowk',
        pincodes: [po('201310', 'Pari Chowk', 28.4633, 77.5089)],
      },
      {
        name: 'Knowledge Park',
        pincodes: [po('201310', 'Knowledge Park', 28.4567, 77.5011)],
      },
      {
        name: 'Greater Noida West',
        aliases: ['Noida Extension West', 'Gaur City'],
        pincodes: [po('201306', 'Greater Noida West', 28.6092, 77.4211)],
      },
      {
        name: 'Jewar',
        pincodes: [po('203135', 'Jewar', 28.1211, 77.5567)],
      },
      {
        name: 'Dadri',
        pincodes: [po('203207', 'Dadri', 28.5533, 77.5567)],
      },
    ],
  },
  {
    name: 'Ghaziabad',
    slug: 'ghaziabad',
    districtSlug: 'ghaziabad',
    stateCode: 'UP',
    lat: 28.6692,
    lng: 77.4538,
    areas: [
      {
        name: 'Indirapuram',
        pincodes: [po('201014', 'Indirapuram', 28.6457, 77.3602)],
      },
      {
        name: 'Vaishali',
        aliases: ['Vaishali Sector 5'],
        pincodes: [
          po('201010', 'Vaishali', 28.6453, 77.3418),
          po('201010', 'Vaishali Sector 5', 28.6489, 77.3389),
        ],
      },
      {
        name: 'Vasundhara',
        aliases: ['Vasundhara Sector 5', 'Vasundhara Sector 12'],
        pincodes: [
          po('201012', 'Vasundhara', 28.6692, 77.3811),
          po('201012', 'Vasundhara Sector 5', 28.6711, 77.3789),
          po('201012', 'Vasundhara Sector 12', 28.6744, 77.3856),
        ],
      },
      {
        name: 'Crossings Republik',
        aliases: ['Crossing Republik'],
        pincodes: [po('201016', 'Crossings Republik', 28.6311, 77.4211)],
      },
      {
        name: 'Raj Nagar',
        aliases: ['Raj Nagar Ghaziabad'],
        pincodes: [po('201002', 'Raj Nagar', 28.6692, 77.4411)],
      },
      {
        name: 'Raj Nagar Extension',
        aliases: ['Raj Nagar Ext', 'Raj Nagar Extension Ghaziabad'],
        pincodes: [po('201017', 'Raj Nagar Extension', 28.6811, 77.4511)],
      },
      {
        name: 'Kavi Nagar',
        pincodes: [po('201002', 'Kavi Nagar', 28.6744, 77.4411)],
      },
      {
        name: 'Sanjay Nagar',
        pincodes: [po('201002', 'Sanjay Nagar', 28.6711, 77.4389)],
      },
      {
        name: 'Mohan Nagar',
        pincodes: [po('201007', 'Mohan Nagar', 28.6811, 77.4011)],
      },
      {
        name: 'Loni',
        pincodes: [po('201102', 'Loni', 28.7511, 77.2911)],
      },
      {
        name: 'Muradnagar',
        aliases: ['Murad Nagar'],
        pincodes: [po('201206', 'Muradnagar', 28.7811, 77.5011)],
      },
      {
        name: 'Modinagar',
        pincodes: [po('201204', 'Modinagar', 28.8311, 77.5811)],
      },
      {
        name: 'Hapur',
        pincodes: [po('245101', 'Hapur', 28.7311, 77.7811)],
      },
      {
        name: 'Meerut Road Corridor',
        aliases: ['Meerut Road', 'Meerut Road Ghaziabad'],
        pincodes: [po('201003', 'Meerut Road', 28.7011, 77.4711)],
      },
    ],
  },

  // ── NCR — Haryana ─────────────────────────────────────────────────────────
  {
    name: 'Gurugram',
    slug: 'gurugram',
    districtSlug: 'gurugram',
    stateCode: 'HR',
    lat: 28.4595,
    lng: 77.0266,
    aliases: ['Gurgaon'],
    areas: [
      {
        name: 'Old Gurgaon',
        aliases: ['Gurgaon Old City', 'Sadar Bazar Gurgaon'],
        pincodes: [po('122001', 'Sadar Bazar Gurgaon', 28.4595, 77.0266)],
      },
      {
        name: 'New Gurgaon',
        aliases: ['New Gurugram'],
        pincodes: [po('122018', 'New Gurgaon', 28.4322, 77.0477)],
      },
      {
        name: 'DLF Phase 1',
        aliases: ['DLF Phase 1 Gurgaon'],
        pincodes: [po('122002', 'DLF Phase 1', 28.4744, 77.096)],
      },
      {
        name: 'DLF Phase 2',
        pincodes: [po('122002', 'DLF Phase 2', 28.4811, 77.0911)],
      },
      {
        name: 'DLF Phase 3',
        aliases: ['DLF Phase 3 Gurgaon'],
        pincodes: [po('122010', 'DLF Phase 3', 28.4947, 77.0888)],
      },
      {
        name: 'DLF Phase 4',
        pincodes: [po('122009', 'DLF Phase 4', 28.4689, 77.0811)],
      },
      {
        name: 'DLF Phase 5',
        pincodes: [po('122002', 'DLF Phase 5', 28.4744, 77.0888)],
      },
      {
        name: 'Cyber City',
        aliases: ['DLF Cyber City'],
        pincodes: [po('122002', 'Cyber City', 28.4947, 77.0888)],
      },
      {
        name: 'Sohna Road',
        aliases: ['Sohna Road Gurgaon'],
        pincodes: [po('122018', 'Sohna Road', 28.4322, 77.0477)],
      },
      {
        name: 'Golf Course Road',
        pincodes: [po('122002', 'Golf Course Road', 28.4595, 77.0811)],
      },
      {
        name: 'Golf Course Extension',
        pincodes: [po('122011', 'Golf Course Extension', 28.4411, 77.0911)],
      },
      {
        name: 'Sector 14',
        pincodes: [po('122001', 'Sector 14 Gurgaon', 28.4689, 77.0411)],
      },
      {
        name: 'Sector 29',
        pincodes: [po('122001', 'Sector 29 Gurgaon', 28.4744, 77.0611)],
      },
      {
        name: 'Sector 56',
        pincodes: [po('122011', 'Sector 56 Gurgaon', 28.4211, 77.0911)],
      },
      {
        name: 'Manesar',
        pincodes: [po('122050', 'Manesar', 28.3567, 76.9411)],
      },
    ],
  },
  {
    name: 'Faridabad',
    slug: 'faridabad',
    districtSlug: 'faridabad',
    stateCode: 'HR',
    lat: 28.4089,
    lng: 77.3178,
    areas: [
      {
        name: 'NIT Faridabad',
        aliases: ['NIT'],
        pincodes: [po('121001', 'NIT Faridabad', 28.3909, 77.3233)],
      },
      {
        name: 'Sector 15 Faridabad',
        pincodes: [po('121007', 'Sector 15 Faridabad', 28.4089, 77.3178)],
      },
      {
        name: 'Sector 21C Faridabad',
        pincodes: [po('121001', 'Sector 21C Faridabad', 28.4011, 77.3111)],
      },
      {
        name: 'Ballabgarh',
        pincodes: [po('121004', 'Ballabgarh', 28.3411, 77.3211)],
      },
      {
        name: 'Old Faridabad',
        pincodes: [po('121002', 'Old Faridabad', 28.4211, 77.3311)],
      },
    ],
  },
  {
    name: 'Bahadurgarh',
    slug: 'bahadurgarh',
    districtSlug: 'jhajjar',
    stateCode: 'HR',
    lat: 28.6911,
    lng: 76.9311,
    areas: [
      {
        name: 'Bahadurgarh',
        pincodes: [po('124507', 'Bahadurgarh', 28.6911, 76.9311)],
      },
      {
        name: 'Bahadurgarh Industrial Area',
        pincodes: [po('124507', 'Bahadurgarh Industrial Area', 28.7011, 76.9411)],
      },
    ],
  },
  {
    name: 'Sonipat',
    slug: 'sonipat',
    districtSlug: 'sonipat',
    stateCode: 'HR',
    lat: 28.9931,
    lng: 77.0156,
    areas: [
      {
        name: 'Sonipat',
        pincodes: [po('131001', 'Sonipat', 28.9931, 77.0156)],
      },
      {
        name: 'Kundli',
        aliases: ['Kundli Industrial Area'],
        pincodes: [po('131028', 'Kundli', 28.8811, 77.1211)],
      },
      {
        name: 'Murthal',
        pincodes: [po('131027', 'Murthal', 28.9811, 77.0711)],
      },
    ],
  },
];
