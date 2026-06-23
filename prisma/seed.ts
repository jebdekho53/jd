/**
 * Jebdekho — Database Seed
 * Seeds roles, permissions, platform settings, Delhi NCR geography, and notification templates.
 * Run: pnpm db:seed  (after prisma migrate dev)
 */

import { NotificationChannel, PrismaClient, RoleName } from '@prisma/client';

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
  { name: 'inventory:read', module: 'inventory', description: 'View inventory' },
  { name: 'inventory:write', module: 'inventory', description: 'Manage inventory' },
  { name: 'orders:update_status', module: 'orders', description: 'Update order status' },
  { name: 'analytics:read', module: 'analytics', description: 'View analytics' },
  // Rider
  { name: 'deliveries:read', module: 'deliveries', description: 'View deliveries' },
  { name: 'deliveries:update', module: 'deliveries', description: 'Update deliveries' },
  { name: 'rider:status', module: 'rider', description: 'Toggle online status' },
  { name: 'rider:location', module: 'rider', description: 'Update location' },
  { name: 'earnings:read', module: 'earnings', description: 'View earnings' },
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
  { name: 'platform:settings', module: 'platform', description: 'Manage platform settings' },
  { name: 'stores:approve', module: 'admin', description: 'Approve stores' },
  { name: 'stores:reject', module: 'admin', description: 'Reject stores' },
  { name: 'stores:suspend', module: 'admin', description: 'Suspend stores' },
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
    'inventory:read', 'inventory:write',
    'orders:read', 'orders:update_status',
    'analytics:read',
    'profile:read', 'profile:write',
  ],
  RIDER: [
    'deliveries:read', 'deliveries:update',
    'rider:status', 'rider:location',
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
    'platform:settings',
    'stores:approve', 'stores:reject', 'stores:suspend',
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

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Starting seed...');

  await seedRolesAndPermissions();
  await seedPlatformSettings();
  await seedDelhiNcr();
  await seedNotificationTemplates();

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
