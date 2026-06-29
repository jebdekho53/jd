/**
 * Jebdekho — Database Seed
 * Seeds roles, permissions, platform settings, Delhi NCR geography, and notification templates.
 * Run: pnpm db:seed  (after prisma migrate dev)
 */

import { NotificationChannel, PrismaClient, RoleName, StoreStatus, UserStatus, MerchantCategoryStatus, CategoryScope, KycStatus, RiderStatus, VehicleType, VendorType, FranchisePartnerStatus, CityLaunchStatus } from '@prisma/client';
import { MENU_CATALOG } from './data/menu-catalog/catalog';
import { assertMenuCatalogSlugUniqueness, upsertMenuCatalog } from './data/menu-catalog/upsert';
import * as bcrypt from 'bcrypt';
import { seedLocationDirectory } from './seed-location-directory';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

const PERMISSIONS = [
  // Buyer
  { name: 'cart:read', module: 'cart', description: 'View cart' },
  { name: 'cart:write', module: 'cart', description: 'Modify cart' },
  { name: 'orders:read', module: 'orders', description: 'View own orders' },
  { name: 'orders:create', module: 'orders', description: 'Place orders' },
  { name: 'orders:cancel', module: 'orders', description: 'Cancel own orders' },
  { name: 'reviews:write', module: 'reviews', description: 'Write reviews' },
  { name: 'wishlist:read', module: 'wishlist', description: 'View wishlist' },
  { name: 'wishlist:write', module: 'wishlist', description: 'Modify wishlist' },
  { name: 'addresses:read', module: 'addresses', description: 'View addresses' },
  { name: 'addresses:write', module: 'addresses', description: 'Manage addresses' },
  { name: 'profile:read', module: 'profile', description: 'View profile' },
  { name: 'profile:write', module: 'profile', description: 'Update profile' },
  // Merchant
  { name: 'stores:read', module: 'stores', description: 'View own stores' },
  { name: 'stores:write', module: 'stores', description: 'Manage own stores' },
  { name: 'stores:submit', module: 'stores', description: 'Submit store for review' },
  { name: 'products:read', module: 'products', description: 'View products' },
  { name: 'products:write', module: 'products', description: 'Manage products' },
  { name: 'categories:read', module: 'categories', description: 'View categories' },
  { name: 'categories:request', module: 'categories', description: 'Request category access' },
  { name: 'inventory:read', module: 'inventory', description: 'View inventory' },
  { name: 'inventory:write', module: 'inventory', description: 'Manage inventory' },
  { name: 'orders:update_status', module: 'orders', description: 'Update order status' },
  { name: 'analytics:read', module: 'analytics', description: 'View analytics' },
  { name: 'payouts:read', module: 'payouts', description: 'View payout requests' },
  { name: 'payouts:request', module: 'payouts', description: 'Request payouts' },
  // Rider
  { name: 'deliveries:read', module: 'deliveries', description: 'View deliveries' },
  { name: 'deliveries:update', module: 'deliveries', description: 'Update deliveries' },
  { name: 'rider:status', module: 'rider', description: 'Toggle online status' },
  { name: 'rider:location', module: 'rider', description: 'Update location' },
  // Rider + Merchant earnings (shared permission name)
  { name: 'earnings:read', module: 'earnings', description: 'View earnings and settlements' },
  // Admin
  { name: 'users:read', module: 'admin', description: 'View users' },
  { name: 'users:manage', module: 'admin', description: 'Manage users' },
  { name: 'merchants:read', module: 'admin', description: 'View merchants' },
  { name: 'merchants:manage', module: 'admin', description: 'Manage merchants' },
  { name: 'riders:read', module: 'admin', description: 'View riders' },
  { name: 'riders:approve', module: 'admin', description: 'Approve riders' },
  { name: 'riders:manage', module: 'admin', description: 'Manage riders' },
  { name: 'orders:manage', module: 'admin', description: 'Manage all orders' },
  { name: 'coupons:read', module: 'coupons', description: 'View coupons' },
  { name: 'coupons:write', module: 'coupons', description: 'Manage coupons' },
  { name: 'cities:read', module: 'geo', description: 'View cities' },
  { name: 'cities:write', module: 'geo', description: 'Manage cities' },
  { name: 'locations:read', module: 'locations', description: 'View master locations' },
  { name: 'locations:manage', module: 'locations', description: 'Manage master locations' },
  { name: 'platform:settings', module: 'platform', description: 'Manage platform settings' },
  { name: 'stores:approve', module: 'admin', description: 'Approve stores' },
  { name: 'stores:reject', module: 'admin', description: 'Reject stores' },
  { name: 'stores:suspend', module: 'admin', description: 'Suspend stores' },
  { name: 'categories:read', module: 'admin', description: 'View global categories' },
  { name: 'categories:manage', module: 'admin', description: 'Manage global categories' },
  { name: 'categories:approve', module: 'admin', description: 'Approve merchant category requests' },
  { name: 'settlements:read', module: 'admin', description: 'View settlements and payout requests' },
  { name: 'settlements:manage', module: 'admin', description: 'Approve and process payouts' },
  // Super Admin only
  { name: 'admins:invite', module: 'admin', description: 'Invite admins' },
  { name: 'admins:manage', module: 'admin', description: 'Manage admins' },
  { name: 'roles:manage', module: 'admin', description: 'Manage roles' },
  { name: 'permissions:manage', module: 'admin', description: 'Manage permissions' },
];

const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  BUYER: [
    'cart:read', 'cart:write',
    'orders:read', 'orders:create', 'orders:cancel',
    'reviews:write',
    'wishlist:read', 'wishlist:write',
    'addresses:read', 'addresses:write',
    'profile:read', 'profile:write',
  ],
  MERCHANT: [
    'stores:read', 'stores:write', 'stores:submit',
    'products:read', 'products:write',
    'categories:read', 'categories:request',
    'inventory:read', 'inventory:write',
    'orders:read', 'orders:update_status',
    'analytics:read',
    'earnings:read', 'payouts:read', 'payouts:request',
    'profile:read', 'profile:write',
  ],
  RIDER: [
    'deliveries:read', 'deliveries:update',
    'rider:status', 'rider:location',
    'earnings:read',
    'profile:read', 'profile:write',
  ],
  VENDOR: [
    'products:read', 'products:write',
    'inventory:read', 'inventory:write',
    'orders:read', 'orders:update_status',
    'analytics:read',
    'profile:read', 'profile:write',
  ],
  FRANCHISE: [
    'analytics:read',
    'stores:read',
    'orders:read',
    'earnings:read',
    'profile:read', 'profile:write',
  ],
  ADMIN: [
    'users:read', 'users:manage',
    'merchants:read', 'merchants:manage',
    'riders:read', 'riders:approve', 'riders:manage',
    'orders:read', 'orders:manage',
    'coupons:read', 'coupons:write',
    'analytics:read',
    'cities:read', 'cities:write',
    'locations:read', 'locations:manage',
    'platform:settings',
    'stores:approve', 'stores:reject', 'stores:suspend',
    'categories:read', 'categories:manage', 'categories:approve',
    'settlements:read', 'settlements:manage',
  ],
  SUPER_ADMIN: [], // will receive ALL permissions in seed
};

// ---------------------------------------------------------------------------
// Geography — Delhi NCR
// ---------------------------------------------------------------------------

const DELHI_NCR_ZONES = [
  { name: 'South Delhi', slug: 'south-delhi', lat: 28.5244, lng: 77.2066, radiusKm: 8 },
  { name: 'Gurgaon', slug: 'gurgaon', lat: 28.4595, lng: 77.0266, radiusKm: 10 },
  { name: 'Noida', slug: 'noida', lat: 28.5355, lng: 77.391, radiusKm: 10 },
  { name: 'Ghaziabad', slug: 'ghaziabad', lat: 28.6692, lng: 77.4538, radiusKm: 8 },
  { name: 'Faridabad', slug: 'faridabad', lat: 28.4089, lng: 77.3178, radiusKm: 8 },
];

const SERVICE_AREAS: Record<string, { name: string; slug: string; lat: number; lng: number; pincode?: string }[]> = {
  'south-delhi': [
    { name: 'Hauz Khas', slug: 'hauz-khas', lat: 28.5494, lng: 77.1855, pincode: '110016' },
    { name: 'Saket', slug: 'saket', lat: 28.5244, lng: 77.2066, pincode: '110017' },
    { name: 'Greater Kailash', slug: 'greater-kailash', lat: 28.5494, lng: 77.2433, pincode: '110048' },
    { name: 'Lajpat Nagar', slug: 'lajpat-nagar', lat: 28.5672, lng: 77.2435, pincode: '110024' },
  ],
  gurgaon: [
    { name: 'Cyber City', slug: 'cyber-city', lat: 28.4947, lng: 77.0888, pincode: '122002' },
    { name: 'DLF Phase 1-3', slug: 'dlf-phase-1-3', lat: 28.4744, lng: 77.096, pincode: '122001' },
    { name: 'Sohna Road', slug: 'sohna-road', lat: 28.4322, lng: 77.0477, pincode: '122018' },
  ],
  noida: [
    { name: 'Sector 18', slug: 'sector-18', lat: 28.5708, lng: 77.3219, pincode: '201301' },
    { name: 'Sector 62', slug: 'sector-62', lat: 28.627, lng: 77.373, pincode: '201309' },
    { name: 'Sector 137', slug: 'sector-137', lat: 28.5009, lng: 77.3865, pincode: '201305' },
  ],
  ghaziabad: [
    { name: 'Indirapuram', slug: 'indirapuram', lat: 28.6457, lng: 77.3602, pincode: '201014' },
    { name: 'Vaishali', slug: 'vaishali', lat: 28.6453, lng: 77.3418, pincode: '201010' },
  ],
  faridabad: [
    { name: 'Sector 15', slug: 'sector-15-faridabad', lat: 28.4089, lng: 77.3178, pincode: '121007' },
    { name: 'NIT Faridabad', slug: 'nit-faridabad', lat: 28.3909, lng: 77.3233, pincode: '121001' },
  ],
};

// ---------------------------------------------------------------------------
// Notification Templates
// ---------------------------------------------------------------------------

const NOTIFICATION_TEMPLATES = [
  {
    code: 'OTP_SMS',
    channel: NotificationChannel.SMS,
    name: 'OTP Verification',
    body: 'Your Jebdekho OTP is {{otp}}. Valid for 5 minutes. Do not share with anyone.',
  },
  {
    code: 'OTP_RESEND_SMS',
    channel: NotificationChannel.SMS,
    name: 'OTP Resend',
    body: 'Your new Jebdekho OTP is {{otp}}. Valid for 5 minutes.',
  },
  {
    code: 'ORDER_CONFIRMED_SMS',
    channel: NotificationChannel.SMS,
    name: 'Order Confirmed',
    body: 'Order #{{orderNumber}} confirmed! Estimated delivery: {{etaMinutes}} mins. Track on Jebdekho.',
  },
  {
    code: 'ORDER_READY_SMS',
    channel: NotificationChannel.SMS,
    name: 'Order Ready for Pickup',
    body: 'Your order #{{orderNumber}} is ready! Rider is on the way.',
  },
  {
    code: 'ORDER_DELIVERED_SMS',
    channel: NotificationChannel.SMS,
    name: 'Order Delivered',
    body: 'Order #{{orderNumber}} delivered! Rate your experience on Jebdekho.',
  },
  {
    code: 'STORE_SUBMITTED_SMS',
    channel: NotificationChannel.SMS,
    name: 'Store Submitted',
    body: 'Your store {{storeName}} is under review. We will notify you within 24 hours.',
  },
  {
    code: 'STORE_APPROVED_SMS',
    channel: NotificationChannel.SMS,
    name: 'Store Approved',
    body: 'Congratulations! Your store {{storeName}} is now live on Jebdekho.',
  },
  {
    code: 'STORE_REJECTED_SMS',
    channel: NotificationChannel.SMS,
    name: 'Store Rejected',
    body: 'Store {{storeName}} needs changes: {{reason}}. Update and resubmit on Jebdekho.',
  },
  {
    code: 'RIDER_ASSIGNMENT_SMS',
    channel: NotificationChannel.SMS,
    name: 'Rider Assignment',
    body: 'New delivery request #{{orderId}}. Accept in 30 seconds on Jebdekho Rider.',
  },
];

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedRolesAndPermissions(): Promise<void> {
  console.log('  Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description, module: perm.module },
      create: perm,
    });
  }

  console.log('  Seeding roles...');
  for (const roleName of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` },
    });
  }

  console.log('  Assigning permissions to roles...');
  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [p.name, p.id]));

  for (const [roleName, permNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName as RoleName } });
    if (!role) continue;

    const names = roleName === 'SUPER_ADMIN' ? allPermissions.map((p) => p.name) : permNames;

    for (const name of names) {
      const permissionId = permMap.get(name);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
}

async function seedPlatformSettings(): Promise<void> {
  console.log('  Seeding platform settings...');
  const settings = [
    { key: 'delivery.default_fee', value: { amount: 29, currency: 'INR' } },
    { key: 'order.min_amount', value: { amount: 99, currency: 'INR' } },
    { key: 'otp.expires_minutes', value: { minutes: 5 } },
    { key: 'otp.max_attempts', value: { attempts: 5 } },
    { key: 'otp.rate_limit', value: { requests: 3, windowMinutes: 10 } },
    { key: 'rider.assignment_timeout_seconds', value: { seconds: 30 } },
    { key: 'store.approval_required', value: { required: true } },
    { key: 'delivery.max_areas_per_store', value: { max: 50 } },
  ];

  for (const setting of settings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
}

async function seedDelhiNcr(): Promise<void> {
  console.log('  Seeding Delhi NCR city...');

  const city = await prisma.city.upsert({
    where: { slug: 'delhi-ncr' },
    update: { isActive: true },
    create: {
      name: 'Delhi NCR',
      slug: 'delhi-ncr',
      state: 'Delhi',
      country: 'IN',
      latitude: 28.6139,
      longitude: 77.209,
      timezone: 'Asia/Kolkata',
      isActive: true,
    },
  });

  console.log('  Seeding zones and service areas...');

  for (const z of DELHI_NCR_ZONES) {
    const zone = await prisma.zone.upsert({
      where: { cityId_slug: { cityId: city.id, slug: z.slug } },
      update: {},
      create: {
        cityId: city.id,
        name: z.name,
        slug: z.slug,
        centerLat: z.lat,
        centerLng: z.lng,
        radiusKm: z.radiusKm,
        isActive: true,
      },
    });

    const areas = SERVICE_AREAS[z.slug] ?? [];
    for (const sa of areas) {
      await prisma.serviceArea.upsert({
        where: { zoneId_slug: { zoneId: zone.id, slug: sa.slug } },
        update: {},
        create: {
          cityId: city.id,
          zoneId: zone.id,
          name: sa.name,
          slug: sa.slug,
          pincode: sa.pincode,
          centerLat: sa.lat,
          centerLng: sa.lng,
          radiusKm: 3,
          isActive: true,
        },
      });
    }
  }
}

async function seedNotificationTemplates(): Promise<void> {
  console.log('  Seeding notification templates...');

  for (const t of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: { body: t.body, name: t.name },
      create: t,
    });
  }
}

async function seedDemoBuyer(): Promise<void> {
  const demoPhone = process.env.DEV_DEMO_PHONE ?? '+919876543210';
  console.log(`  Seeding demo buyer (${demoPhone})...`);

  const buyerRole = await prisma.role.findUnique({ where: { name: RoleName.BUYER } });
  if (!buyerRole) {
    console.warn('  BUYER role not found — skip demo buyer seed');
    return;
  }

  const user = await prisma.user.upsert({
    where: { phone: demoPhone },
    update: {
      status: UserStatus.ACTIVE,
      phoneVerified: true,
    },
    create: {
      phone: demoPhone,
      status: UserStatus.ACTIVE,
      phoneVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: buyerRole.id } },
    update: {},
    create: { userId: user.id, roleId: buyerRole.id },
  });

  await prisma.buyerProfile.upsert({
    where: { userId: user.id },
    update: { name: 'Demo User' },
    create: { userId: user.id, name: 'Demo User' },
  });
}

async function seedDemoMerchantAccount(params: {
  phone: string;
  email: string;
  businessName: string;
  storeSlug: string;
  storeName: string;
  description: string;
  gstNumber: string;
  panNumber: string;
  line1: string;
  pincode: string;
}): Promise<void> {
  const {
    phone,
    email,
    businessName,
    storeSlug,
    storeName,
    description,
    gstNumber,
    panNumber,
    line1,
    pincode,
  } = params;
  console.log(`  Seeding demo merchant (${phone}, ${email})...`);

  const merchantRole = await prisma.role.findUnique({ where: { name: RoleName.MERCHANT } });
  if (!merchantRole) {
    console.warn('  MERCHANT role not found — skip demo merchant seed');
    return;
  }

  const city = await prisma.city.findUnique({ where: { slug: 'delhi-ncr' } });
  if (!city) {
    console.warn('  Delhi NCR city not found — skip demo merchant store');
    return;
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      email,
      status: UserStatus.ACTIVE,
      phoneVerified: true,
      emailVerified: true,
    },
    create: {
      phone,
      email,
      status: UserStatus.ACTIVE,
      phoneVerified: true,
      emailVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: merchantRole.id } },
    update: {},
    create: { userId: user.id, roleId: merchantRole.id },
  });

  const merchantProfile = await prisma.merchantProfile.upsert({
    where: { userId: user.id },
    update: { businessName, gstNumber, panNumber },
    create: {
      userId: user.id,
      businessName,
      gstNumber,
      panNumber,
    },
  });

  await prisma.store.upsert({
    where: {
      merchantProfileId_slug: {
        merchantProfileId: merchantProfile.id,
        slug: storeSlug,
      },
    },
    update: {
      status: StoreStatus.APPROVED,
      isActive: true,
      name: storeName,
    },
    create: {
      merchantProfileId: merchantProfile.id,
      cityId: city.id,
      name: storeName,
      slug: storeSlug,
      description,
      line1,
      pincode,
      latitude: 28.6139,
      longitude: 77.209,
      status: StoreStatus.APPROVED,
      isActive: true,
      phone,
      email,
    },
  });
}

async function seedDemoMerchants(): Promise<void> {
  await seedDemoMerchantAccount({
    phone: process.env.DEV_DEMO_MERCHANT_PHONE ?? '+919876543211',
    email: process.env.DEV_DEMO_MERCHANT_EMAIL ?? 'merchant@demo.jebdekho.com',
    businessName: 'Demo Grocery Store',
    storeSlug: 'demo-grocery',
    storeName: 'Demo Grocery Store',
    description: 'Demo store for merchant portal testing',
    gstNumber: '07AAGCR2206E1ZN',
    panNumber: 'AAGCR2206E',
    line1: '123 MG Road',
    pincode: '110001',
  });

  await seedDemoMerchantAccount({
    phone: process.env.DEV_DEMO_MERCHANT_PHONE_2 ?? '+919876543213',
    email: process.env.DEV_DEMO_MERCHANT_EMAIL_2 ?? 'merchant2@demo.jebdekho.com',
    businessName: 'Demo Electronics Store',
    storeSlug: 'demo-electronics',
    storeName: 'Demo Electronics Store',
    description: 'Second demo merchant for parallel testing',
    gstNumber: '29AABCU9603R1ZM',
    panNumber: 'AABCU9603R',
    line1: '45 Nehru Place',
    pincode: '110019',
  });
}

async function seedDemoAdmin(): Promise<void> {
  const demoPhone = process.env.DEV_DEMO_ADMIN_PHONE ?? '+919876543212';
  const demoEmail = process.env.DEV_DEMO_ADMIN_EMAIL ?? 'admin@demo.jebdekho.com';
  const demoPassword = process.env.DEV_DEMO_ADMIN_PASSWORD ?? 'Admin@123456';
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  console.log(`  Seeding demo admin (${demoPhone})...`);

  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.ADMIN } });
  if (!adminRole) {
    console.warn('  ADMIN role not found — skip demo admin seed');
    return;
  }

  const user = await prisma.user.upsert({
    where: { phone: demoPhone },
    update: {
      email: demoEmail,
      passwordHash,
      status: UserStatus.ACTIVE,
      phoneVerified: true,
      emailVerified: true,
    },
    create: {
      phone: demoPhone,
      email: demoEmail,
      passwordHash,
      status: UserStatus.ACTIVE,
      phoneVerified: true,
      emailVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });

  await prisma.adminProfile.upsert({
    where: { userId: user.id },
    update: { name: 'Demo Admin' },
    create: {
      userId: user.id,
      name: 'Demo Admin',
      department: 'Operations',
      isSuperAdmin: false,
    },
  });
}

async function seedGlobalCategories(): Promise<void> {
  console.log('  Seeding global categories...');

  const catalog: Array<{
    name: string;
    slug: string;
    sortOrder: number;
    children?: Array<{ name: string; slug: string; sortOrder: number }>;
  }> = [
    {
      name: 'Grocery',
      slug: 'grocery',
      sortOrder: 1,
      children: [
        { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', sortOrder: 1 },
        { name: 'Dairy & Bakery', slug: 'dairy-bakery', sortOrder: 2 },
      ],
    },
    {
      name: 'Electronics',
      slug: 'electronics',
      sortOrder: 2,
      children: [
        { name: 'Mobile Accessories', slug: 'mobile-accessories', sortOrder: 1 },
        { name: 'Home Appliances', slug: 'home-appliances', sortOrder: 2 },
      ],
    },
    {
      name: 'Health & Nutrition',
      slug: 'health-nutrition',
      sortOrder: 3,
      children: [
        { name: 'Supplements', slug: 'supplements', sortOrder: 1 },
        { name: 'Personal Care', slug: 'personal-care', sortOrder: 2 },
      ],
    },
  ];

  for (const item of catalog) {
    let parent = await prisma.category.findFirst({
      where: { slug: item.slug, storeId: null, parentId: null },
    });
    if (!parent) {
      parent = await prisma.category.create({
        data: {
          name: item.name,
          slug: item.slug,
          sortOrder: item.sortOrder,
          scope: CategoryScope.GLOBAL,
          isActive: true,
        },
      });
    } else {
      parent = await prisma.category.update({
        where: { id: parent.id },
        data: { name: item.name, sortOrder: item.sortOrder, isActive: true },
      });
    }

    for (const child of item.children ?? []) {
      const existingChild = await prisma.category.findFirst({
        where: { slug: child.slug, storeId: null, parentId: parent.id },
      });
      if (!existingChild) {
        await prisma.category.create({
          data: {
            name: child.name,
            slug: child.slug,
            parentId: parent.id,
            sortOrder: child.sortOrder,
            scope: CategoryScope.GLOBAL,
            isActive: true,
          },
        });
      } else {
        await prisma.category.update({
          where: { id: existingChild.id },
          data: { name: child.name, sortOrder: child.sortOrder, isActive: true },
        });
      }
    }
  }
}

async function seedDemoMerchantCategoryApprovals(): Promise<void> {
  const demoPhone = process.env.DEV_DEMO_MERCHANT_PHONE ?? '+919876543211';
  const user = await prisma.user.findUnique({ where: { phone: demoPhone } });
  if (!user) return;

  const profile = await prisma.merchantProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return;

  const grocery = await prisma.category.findFirst({ where: { slug: 'grocery', storeId: null } });
  const fruits = await prisma.category.findFirst({ where: { slug: 'fruits-vegetables', storeId: null } });
  if (!grocery || !fruits) return;

  for (const categoryId of [grocery.id, fruits.id]) {
    await prisma.merchantCategory.upsert({
      where: {
        merchantProfileId_categoryId: {
          merchantProfileId: profile.id,
          categoryId,
        },
      },
      update: { status: MerchantCategoryStatus.APPROVED },
      create: {
        merchantProfileId: profile.id,
        categoryId,
        status: MerchantCategoryStatus.APPROVED,
        submittedAt: new Date(),
        reviewedAt: new Date(),
      },
    });
  }
}

async function seedDemoStoreZones(): Promise<void> {
  console.log('  Seeding demo store zones...');

  const zone = await prisma.zone.findFirst({
    where: { slug: 'south-delhi' },
    select: { id: true },
  });
  if (!zone) {
    console.warn('  south-delhi zone not found — skip store zone seed');
    return;
  }

  const stores = await prisma.store.findMany({
    where: { slug: { in: ['demo-grocery', 'demo-electronics'] } },
    select: { id: true },
  });

  for (const store of stores) {
    await prisma.storeZone.upsert({
      where: { storeId_zoneId: { storeId: store.id, zoneId: zone.id } },
      update: {},
      create: { storeId: store.id, zoneId: zone.id },
    });
  }
}

async function seedDemoRider(): Promise<void> {
  const demoPhone = process.env.DEV_DEMO_RIDER_PHONE ?? '+919876543214';
  console.log(`  Seeding demo rider (${demoPhone})...`);

  const riderRole = await prisma.role.findUnique({ where: { name: RoleName.RIDER } });
  if (!riderRole) {
    console.warn('  RIDER role not found — skip demo rider seed');
    return;
  }

  const zone = await prisma.zone.findFirst({
    where: { slug: 'south-delhi' },
    select: { id: true },
  });

  const user = await prisma.user.upsert({
    where: { phone: demoPhone },
    update: {
      status: UserStatus.ACTIVE,
      phoneVerified: true,
    },
    create: {
      phone: demoPhone,
      status: UserStatus.ACTIVE,
      phoneVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: riderRole.id } },
    update: {},
    create: { userId: user.id, roleId: riderRole.id },
  });

  const riderProfile = await prisma.riderProfile.upsert({
    where: { userId: user.id },
    update: {
      name: 'Demo Rider',
      kycStatus: KycStatus.APPROVED,
      status: RiderStatus.ONLINE,
      currentLat: 28.614,
      currentLng: 77.21,
      lastLocationAt: new Date(),
      vehicleType: VehicleType.MOTORCYCLE,
      vehicleNumber: 'DL01AB1234',
    },
    create: {
      userId: user.id,
      name: 'Demo Rider',
      vehicleType: VehicleType.MOTORCYCLE,
      vehicleNumber: 'DL01AB1234',
      kycStatus: KycStatus.APPROVED,
      status: RiderStatus.ONLINE,
      currentLat: 28.614,
      currentLng: 77.21,
      lastLocationAt: new Date(),
    },
  });

  if (zone) {
    await prisma.riderZone.upsert({
      where: {
        riderProfileId_zoneId: { riderProfileId: riderProfile.id, zoneId: zone.id },
      },
      update: {},
      create: { riderProfileId: riderProfile.id, zoneId: zone.id },
    });
  }
}

async function seedDemoVendors(): Promise<void> {
  const vendorRole = await prisma.role.findUnique({ where: { name: RoleName.VENDOR } });
  if (!vendorRole) return;

  const city = await prisma.city.findFirst({ where: { slug: 'delhi' } });
  const phone = '+919876543299';

  const user = await prisma.user.upsert({
    where: { phone },
    update: { status: UserStatus.ACTIVE, phoneVerified: true },
    create: { phone, status: UserStatus.ACTIVE, phoneVerified: true },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: vendorRole.id } },
    update: {},
    create: { userId: user.id, roleId: vendorRole.id },
  });

  const vendor = await prisma.vendor.upsert({
    where: { id: 'seed-vendor-abc-distributor' },
    update: {},
    create: {
      id: 'seed-vendor-abc-distributor',
      vendorType: VendorType.DISTRIBUTOR,
      businessName: 'ABC Distributor',
      gstNumber: '07AABCU9603R1ZM',
      phone,
      email: 'vendor@jebdekho.demo',
      cityId: city?.id,
      line1: 'Industrial Area, Phase 2',
      pincode: '110020',
      latitude: 28.61,
      longitude: 77.23,
      isActive: true,
      ratingAvg: 4.5,
      ratingCount: 12,
    },
  });

  await prisma.vendorProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, vendorId: vendor.id },
  });

  const catalog = await prisma.vendorCatalog.upsert({
    where: { id: 'seed-catalog-abc' },
    update: {},
    create: {
      id: 'seed-catalog-abc',
      vendorId: vendor.id,
      name: 'Health & Nutrition',
      description: 'Protein, supplements, and wellness products',
    },
  });

  const product = await prisma.vendorProduct.upsert({
    where: { vendorId_sku: { vendorId: vendor.id, sku: 'WHEY-1KG' } },
    update: {},
    create: {
      vendorId: vendor.id,
      catalogId: catalog.id,
      name: 'Whey Protein 1kg',
      sku: 'WHEY-1KG',
      category: 'Supplements',
      hsnCode: '21069099',
      gstRate: 18,
      basePrice: 2400,
      moq: 10,
      leadTimeDays: 2,
      inventory: { create: { availableQty: 500 } },
    },
  });

  await prisma.vendorPriceTier.upsert({
    where: { id: 'seed-tier-whey-50' },
    update: {},
    create: {
      id: 'seed-tier-whey-50',
      vendorProductId: product.id,
      minQty: 50,
      unitPrice: 2200,
    },
  });

  const merchant = await prisma.merchantProfile.findFirst();
  if (merchant) {
    await prisma.vendorCreditLine.upsert({
      where: { vendorId_merchantProfileId: { vendorId: vendor.id, merchantProfileId: merchant.id } },
      update: {},
      create: {
        vendorId: vendor.id,
        merchantProfileId: merchant.id,
        creditLimit: 100000,
        usedLimit: 0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
}

async function seedDemoFranchise(): Promise<void> {
  const franchiseRole = await prisma.role.findUnique({ where: { name: RoleName.FRANCHISE } });
  if (!franchiseRole) return;

  const delhi = await prisma.city.findFirst({ where: { slug: 'delhi' } });
  const phone = '+919876543298';

  const user = await prisma.user.upsert({
    where: { phone },
    update: { status: UserStatus.ACTIVE, phoneVerified: true },
    create: { phone, status: UserStatus.ACTIVE, phoneVerified: true },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: franchiseRole.id } },
    update: {},
    create: { userId: user.id, roleId: franchiseRole.id },
  });

  const partner = await prisma.franchisePartner.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      businessName: 'NCR Franchise Partners Pvt Ltd',
      gstin: '07AABCF1234R1Z5',
      pan: 'AABCF1234R',
      status: FranchisePartnerStatus.ACTIVE,
      commissionPercent: 5,
      onboardingCompleted: true,
      cityId: delhi?.id,
    },
  });

  await prisma.franchiseTerritory.upsert({
    where: { id: 'seed-franchise-territory-ncr' },
    update: {},
    create: {
      id: 'seed-franchise-territory-ncr',
      franchiseId: partner.id,
      city: 'Delhi',
      state: 'Delhi',
      country: 'IN',
      pincodes: ['110001', '110002', '110003', '110020'],
      exclusivityEnabled: true,
      launchDate: new Date(),
    },
  });

  const store = await prisma.store.findFirst({ where: { status: StoreStatus.APPROVED } });
  if (store) {
    await prisma.franchiseStore.upsert({
      where: { franchiseId_storeId: { franchiseId: partner.id, storeId: store.id } },
      update: {},
      create: { franchiseId: partner.id, storeId: store.id },
    });
  }

  const launchCities: Array<{ city: string; state: string; status: CityLaunchStatus; targetGmv: number }> = [
    { city: 'Lucknow', state: 'Uttar Pradesh', status: CityLaunchStatus.RECRUITING, targetGmv: 5000000 },
    { city: 'Kanpur', state: 'Uttar Pradesh', status: CityLaunchStatus.PLANNING, targetGmv: 3000000 },
    { city: 'Prayagraj', state: 'Uttar Pradesh', status: CityLaunchStatus.RESEARCH, targetGmv: 2000000 },
  ];

  for (const lc of launchCities) {
    await prisma.cityLaunchPlan.upsert({
      where: { city_state: { city: lc.city, state: lc.state } },
      update: {},
      create: {
        city: lc.city,
        state: lc.state,
        launchStatus: lc.status,
        readinessScore: lc.status === CityLaunchStatus.RECRUITING ? 62 : lc.status === CityLaunchStatus.PLANNING ? 45 : 28,
        targetStores: 30,
        targetRiders: 80,
        targetGmv: lc.targetGmv,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function seedMembershipPlan(): Promise<void> {
  const { MembershipBenefitType } = await import('@prisma/client');
  const plan = await prisma.membershipPlan.upsert({
    where: { id: 'seed-plus-plan' },
    update: {},
    create: {
      id: 'seed-plus-plan',
      name: 'JebDekho Plus',
      monthlyPrice: 99,
      yearlyPrice: 999,
      active: true,
    },
  });
  const benefits = [
    MembershipBenefitType.FREE_DELIVERY,
    MembershipBenefitType.PRIORITY_DELIVERY,
    MembershipBenefitType.EXTRA_REWARDS,
    MembershipBenefitType.VIP_SUPPORT,
    MembershipBenefitType.EXCLUSIVE_OFFERS,
  ];
  for (const type of benefits) {
    await prisma.membershipBenefit.upsert({
      where: { planId_type: { planId: plan.id, type } },
      update: {},
      create: { planId: plan.id, type },
    });
  }
}

async function seedMenuCatalog(): Promise<void> {
  console.log('  Seeding MENU catalog (Food, Cafe, Bakery…)…');
  assertMenuCatalogSlugUniqueness(MENU_CATALOG);
  const stats = await upsertMenuCatalog(prisma, MENU_CATALOG);
  console.log(
    `  MENU catalog: ${stats.parentsCreated + stats.parentsUpdated} parents, ${stats.childrenCreated + stats.childrenUpdated} subcategories`,
  );
}

async function main(): Promise<void> {
  console.log('Starting seed...');

  await seedRolesAndPermissions();
  await seedPlatformSettings();
  await seedDelhiNcr();
  await seedLocationDirectory();
  await seedNotificationTemplates();
  await seedGlobalCategories();
  await seedMenuCatalog();
  await seedDemoBuyer();
  await seedDemoMerchants();
  await seedDemoStoreZones();
  await seedDemoMerchantCategoryApprovals();
  await seedDemoRider();
  await seedDemoAdmin();
  await seedDemoVendors();
  await seedDemoFranchise();
  await seedMembershipPlan();

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
