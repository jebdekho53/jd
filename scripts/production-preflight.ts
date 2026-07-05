/**
 * Production preflight verification — READ-ONLY go/no-go check before deploy.
 *
 *   pnpm exec tsx scripts/production-preflight.ts
 *   NODE_ENV=production pnpm exec tsx scripts/production-preflight.ts   # strict prod checks
 *
 * Verifies the known production blockers and the critical-fix invariants:
 *   - JWT signing keypair actually matches (the "corrupt public key" class of bug)
 *   - OTP can be delivered (WhatsApp Cloud API or MSG91) when phone OTP is on
 *   - Logistics provider (Shadowfax) is configured — else delivery cannot happen
 *   - Razorpay keys are present and correct for the environment (live vs test)
 *   - Core infra (Postgres, Redis) is configured
 *   - Reference data is seeded (ledger accounts, HSN, support categories, hours, …)
 *   - No demo-auth bypass or hardcoded Connaught Place/Delhi fallback has crept back
 *
 * Exits non-zero if any FAIL. Never mutates anything.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import * as crypto from 'crypto';

const ROOT = resolve(__dirname, '..');
const IS_PROD = process.env.NODE_ENV === 'production';

type Status = 'PASS' | 'WARN' | 'FAIL';
const results: { name: string; status: Status; detail: string }[] = [];
function record(name: string, status: Status, detail = '') {
  results.push({ name, status, detail });
}

// ── env loading (mirrors apps/api/src/config/env-path.ts resolution) ──────────
function loadEnv(): Record<string, string> {
  const files = IS_PROD
    ? ['.env.production', '.env']
    : ['.env'];
  const out: Record<string, string> = {};
  for (const f of files) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    parseEnvFile(readFileSync(p, 'utf8'), out);
  }
  return out;
}

/** Minimal .env parser that correctly handles double-quoted multiline values (PEM keys). */
function parseEnvFile(text: string, out: Record<string, string>) {
  const re = /^([A-Z0-9_]+)=("(?:[^"\\]|\\.|\n)*"|.*)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = m[1]!;
    let val = m[2] ?? '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (out[key] === undefined) out[key] = val;
  }
}
const normPem = (s: string) => (s || '').replace(/\\n/g, '\n');

// ── checks ────────────────────────────────────────────────────────────────
function checkJwt(env: Record<string, string>) {
  const priv = normPem(env.JWT_PRIVATE_KEY ?? '');
  const pub = normPem(env.JWT_PUBLIC_KEY ?? '');
  if (!priv || !pub) {
    record('JWT keypair', IS_PROD ? 'FAIL' : 'WARN', 'JWT_PRIVATE_KEY / JWT_PUBLIC_KEY not set');
    return;
  }
  try {
    const derived = crypto.createPublicKey(priv).export({ type: 'spki', format: 'pem' }).toString().trim();
    const provided = crypto.createPublicKey(pub).export({ type: 'spki', format: 'pem' }).toString().trim();
    if (derived === provided) {
      // round-trip sign/verify to be certain
      const jose = crypto.sign('sha256', Buffer.from('x'), priv);
      const ok = crypto.verify('sha256', Buffer.from('x'), pub, jose);
      record('JWT keypair', ok ? 'PASS' : 'FAIL', ok ? 'private/public match' : 'sign/verify failed');
    } else {
      record('JWT keypair', 'FAIL', 'PUBLIC key does not match PRIVATE key — all auth will 401');
    }
  } catch (e) {
    record('JWT keypair', 'FAIL', `key parse error: ${(e as Error).message}`);
  }
  if (!env.JWT_ISSUER || !env.JWT_AUDIENCE) {
    record('JWT issuer/audience', 'WARN', 'JWT_ISSUER / JWT_AUDIENCE not both set');
  }
}

function checkOtpDelivery(env: Record<string, string>) {
  const phoneOtp = /^(true|1)$/i.test(env.AUTH_PHONE_OTP_ENABLED ?? '');
  if (!phoneOtp) {
    record('OTP delivery', 'WARN', 'AUTH_PHONE_OTP_ENABLED is off — phone login disabled');
    return;
  }
  const waOn = /^(true|1)$/i.test(env.ENABLE_WHATSAPP_OTP ?? '');
  const waReady = waOn && !!env.WHATSAPP_ACCESS_TOKEN && !!env.WHATSAPP_PHONE_NUMBER_ID;
  const smsReady =
    /^(true|1)$/i.test(env.MSG91_ENABLED ?? '') && !!env.MSG91_AUTH_KEY && !!env.MSG91_TEMPLATE_ID;
  if (waReady || smsReady) {
    record('OTP delivery', 'PASS', waReady ? 'WhatsApp Cloud API configured' : 'MSG91 SMS configured');
  } else {
    record(
      'OTP delivery',
      IS_PROD ? 'FAIL' : 'WARN',
      'phone OTP on but NO channel configured — real users cannot receive OTP (set WhatsApp creds or MSG91)',
    );
  }
  if (waOn && !env.WHATSAPP_PHONE_NUMBER_ID) {
    record('WhatsApp config', 'FAIL', 'ENABLE_WHATSAPP_OTP=true but WHATSAPP_PHONE_NUMBER_ID empty — API will not boot');
  }
}

function checkLogistics(env: Record<string, string>) {
  const url = env.SHADOWFAX_API_URL ?? '';
  const mode = env.SHADOWFAX_API_MODE ?? '';
  const token = IS_PROD
    ? env.SHADOWFAX_PRODUCTION_TOKEN
    : env.SHADOWFAX_TEST_TOKEN || env.SHADOWFAX_PRODUCTION_TOKEN;
  if (url && token) record('Logistics (Shadowfax)', 'PASS', `creds present (mode=${mode || 'n/a'}) — verify activation with pnpm shadowfax:health`);
  else
    record(
      'Logistics (Shadowfax)',
      IS_PROD ? 'FAIL' : 'WARN',
      'Shadowfax URL/token missing — orders cannot be dispatched or delivered',
    );
}

function checkPayments(env: Record<string, string>) {
  const key = env.RAZORPAY_KEY_ID ?? '';
  const secret = env.RAZORPAY_KEY_SECRET ?? '';
  if (!key || !secret) {
    record('Razorpay', 'FAIL', 'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing');
    return;
  }
  const isLive = key.startsWith('rzp_live_');
  if (IS_PROD && !isLive) record('Razorpay', 'FAIL', 'production must use rzp_live_ keys');
  else if (!IS_PROD && isLive) record('Razorpay', 'WARN', 'LIVE keys in a non-production env — real charges possible');
  else record('Razorpay', 'PASS', isLive ? 'live keys' : 'test keys');
  if (!env.RAZORPAY_WEBHOOK_SECRET) record('Razorpay webhook', 'WARN', 'RAZORPAY_WEBHOOK_SECRET not set');
}

function checkInfra(env: Record<string, string>) {
  record('Database URL', env.DATABASE_URL ? 'PASS' : 'FAIL', env.DATABASE_URL ? '' : 'DATABASE_URL missing');
  const redis = env.REDIS_URL || env.REDIS_HOST;
  record('Redis', redis ? 'PASS' : 'FAIL', redis ? '' : 'REDIS_URL / REDIS_HOST missing');
}

// ── source scan: no demo/fallback regressions ────────────────────────────────
function scanSource() {
  // Demo-auth reintroduction — any reference is a fail.
  const demoRe = /demo-auth|DEMO_OTP|DEMO_PHONE|isDemoPhone|Use demo number|Demo login/;
  // Hardcoded Connaught Place / Delhi fallback. The coords also appear legitimately as:
  //   - Swagger `example:` values in DTOs (docs, not logic)
  //   - anti-fallback GUARDS that compare against the old default to REJECT it
  //     (e.g. isDefaultDelhiCoords, Math.abs(lat - 28.6139) …) — these enforce
  //     "no fallback", so they are fine.
  // A coordinate hit only counts as a real fallback when it is an ASSIGNMENT and
  // neither a doc line nor a comparison/guard.
  const cpCoordRe = /28\.6139|77\.209/;
  const cpLabelRe = /Connaught\s*Place/i;
  const docLineRe = /example\s*:|@ApiProperty|@ApiPropertyOptional|description\s*:|^\s*\*|\/\//;
  const guardLineRe = /Math\.abs|-\s*28\.6139|-\s*77\.209|[=!<>]=|isDefaultDelhi|<\s*0\.\d+/;
  const demoHits: string[] = [];
  const cpHits: string[] = [];
  const dirs = ['apps/api/src', 'apps/buyer-web', 'apps/merchant-web', 'apps/admin-web', 'packages'];
  const skip = /node_modules|\.next|dist|\.turbo|__tests__|\.spec\.|\.test\.|e2e|playwright/;
  const walk = (dir: string) => {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) return;
    for (const entry of readdirSync(abs)) {
      const rel = join(dir, entry);
      const full = join(ROOT, rel);
      if (skip.test(rel)) continue;
      let s;
      try { s = statSync(full); } catch { continue; }
      if (s.isDirectory()) walk(rel);
      else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
        let content = '';
        try { content = readFileSync(full, 'utf8'); } catch { continue; }
        if (demoRe.test(content)) demoHits.push(rel);
        const lines = content.split('\n');
        const realFallback = lines.some(
          (l) =>
            cpLabelRe.test(l) ||
            (cpCoordRe.test(l) && !docLineRe.test(l) && !guardLineRe.test(l)),
        );
        if (realFallback) cpHits.push(rel);
      }
    }
  };
  dirs.forEach(walk);
  record(
    'No demo-auth regression',
    demoHits.length ? 'FAIL' : 'PASS',
    demoHits.length ? `demo refs in: ${demoHits.slice(0, 5).join(', ')}` : 'clean',
  );
  record(
    'No Connaught Place/Delhi fallback',
    cpHits.length ? 'FAIL' : 'PASS',
    cpHits.length ? `coords/label in: ${cpHits.slice(0, 5).join(', ')}` : 'clean',
  );
}

// ── reference-data seed check (DB) ───────────────────────────────────────────
async function checkSeedData() {
  let PrismaClient: any;
  try {
    ({ PrismaClient } = await import('@prisma/client'));
  } catch {
    record('Reference data', 'WARN', '@prisma/client not available — skipped DB checks');
    return;
  }
  const prisma = new PrismaClient();
  const count = async (sql: string): Promise<number> => {
    const rows = (await prisma.$queryRawUnsafe(sql)) as Array<{ n: bigint | number }>;
    return Number(rows[0]?.n ?? 0);
  };
  try {
    const checks: [string, string, Status][] = [
      ['ledger_accounts', 'select count(*) as n from ledger_accounts', 'FAIL'],
      ['hsn_codes', 'select count(*) as n from hsn_codes', 'WARN'],
      ['support_categories', 'select count(*) as n from support_categories', 'WARN'],
      ['products', 'select count(*) as n from products', 'WARN'],
      ['menu categories', "select count(*) as n from categories where catalog_kind='MENU'", 'WARN'],
    ];
    for (const [name, sql, failStatus] of checks) {
      try {
        const n = await count(sql);
        record(`seed: ${name}`, n > 0 ? 'PASS' : failStatus, `${n} rows`);
      } catch (e) {
        record(`seed: ${name}`, 'WARN', `query failed: ${(e as Error).message}`);
      }
    }
    // active stores must have hours or they never open
    try {
      const missing = await count(
        `select count(*) as n from stores s where s.is_active = true
           and not exists (select 1 from store_hours h where h.store_id = s.id)`,
      );
      const total = await count('select count(*) as n from stores where is_active = true');
      record(
        'seed: store_hours',
        missing > 0 ? 'WARN' : 'PASS',
        missing > 0
          ? `${missing}/${total} active store(s) have no hours (will show closed)`
          : `all ${total} active store(s) have hours`,
      );
    } catch (e) {
      record('seed: store_hours', 'WARN', `check failed: ${(e as Error).message}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// ── run ──────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv();
  console.log(`\nJebDekho production preflight  (NODE_ENV=${process.env.NODE_ENV ?? 'undefined'})\n${'─'.repeat(60)}`);

  checkJwt(env);
  checkOtpDelivery(env);
  checkLogistics(env);
  checkPayments(env);
  checkInfra(env);
  scanSource();
  await checkSeedData();

  const icon = (s: Status) => (s === 'PASS' ? '✅' : s === 'WARN' ? '⚠️ ' : '❌');
  for (const r of results) {
    console.log(`${icon(r.status)} ${r.name.padEnd(34)} ${r.detail}`);
  }

  const fails = results.filter((r) => r.status === 'FAIL').length;
  const warns = results.filter((r) => r.status === 'WARN').length;
  console.log('─'.repeat(60));
  console.log(`${fails} FAIL · ${warns} WARN · ${results.length - fails - warns} PASS`);
  console.log(
    fails
      ? '\n❌ NOT production-ready — resolve FAILs above.\n'
      : warns
        ? '\n⚠️  No hard blockers, but review WARNs before go-live.\n'
        : '\n✅ Preflight clean.\n',
  );
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error('preflight crashed:', e);
  process.exit(2);
});
