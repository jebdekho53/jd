/**
 * Cloudflare CDN readiness preflight — READ-ONLY.
 *
 *   pnpm cdn:preflight
 *   NODE_ENV=production pnpm cdn:preflight            # strict prod checks
 *   PREFLIGHT_BASE=https://api.jebdekho.com pnpm cdn:preflight  # override origin
 *
 * Verifies the repository + origin are ready to sit behind Cloudflare. It never
 * changes DNS, never calls a Cloudflare API, never purges cache, never touches
 * the database, never creates orders/payments/shipments, and needs no API token.
 *
 * Checks: required env, optional CDN_PUBLIC_URL validity, Next.js allowed image
 * hosts, /uploads status + MIME + Cache-Control + nosniff, HTTPS behaviour,
 * redirect loops, API health, WebSocket upstream config, nginx syntax, the
 * Cloudflare real-IP include, and that sensitive API paths are NOT publicly
 * cacheable.
 *
 * Exit code: non-zero only if any check FAILs. WARN never fails the run — it
 * flags things a network-less CI cannot verify or that need a human decision.
 */
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(__dirname, '..');
const IS_PROD = process.env.NODE_ENV === 'production';

type Status = 'PASS' | 'WARN' | 'FAIL';
const results: { name: string; status: Status; detail: string; fix?: string }[] = [];
function record(name: string, status: Status, detail = '', fix?: string) {
  results.push({ name, status, detail, fix });
}

// ── env loading (mirrors scripts/production-preflight.ts) ─────────────────────
function loadEnv(): Record<string, string> {
  const files = IS_PROD ? ['.env.production', '.env'] : ['.env'];
  const out: Record<string, string> = {};
  for (const f of files) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    const re = /^([A-Z0-9_]+)=("(?:[^"\\]|\\.|\n)*"|.*)$/gm;
    const text = readFileSync(p, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const key = m[1]!;
      let val = m[2] ?? '';
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (out[key] === undefined) out[key] = val;
    }
  }
  for (const [k, v] of Object.entries(out)) process.env[k] ??= v;
  return out;
}

async function fetchHead(url: string, opts: { redirect?: 'follow' | 'manual' } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    // GET (not HEAD) — some static handlers/CDNs treat HEAD differently.
    return await fetch(url, { signal: ctrl.signal, redirect: opts.redirect ?? 'manual' });
  } finally {
    clearTimeout(t);
  }
}

function firstUploadFileUrl(uploadDir: string, base: string): string | null {
  if (!existsSync(uploadDir)) return null;
  const walk = (dir: string, depth: number): string | null => {
    if (depth > 3) return null;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return null;
    }
    for (const e of entries) {
      const full = join(dir, e);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isFile() && /\.(jpe?g|png|webp|gif|pdf)$/i.test(e)) {
        const rel = full.slice(uploadDir.length).replace(/^[/\\]/, '').split(/[/\\]/).join('/');
        return `${base.replace(/\/$/, '')}/${rel}`;
      }
      if (st.isDirectory()) {
        const found = walk(full, depth + 1);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(uploadDir, 0);
}

async function main() {
  loadEnv();

  const uploadPublicUrl = process.env.UPLOAD_PUBLIC_URL || 'https://api.jebdekho.com/uploads';
  const cdnPublicUrl = (process.env.CDN_PUBLIC_URL || '').trim();
  const uploadDir = process.env.UPLOAD_DIR || '/var/www/jebdekho/uploads';
  const apiOrigin =
    process.env.PREFLIGHT_BASE?.replace(/\/$/, '') ||
    uploadPublicUrl.replace(/\/uploads\/?$/, '');

  // 1) Required env ----------------------------------------------------------
  if (process.env.UPLOAD_PUBLIC_URL) {
    record('UPLOAD_PUBLIC_URL set', 'PASS', uploadPublicUrl);
  } else {
    record(
      'UPLOAD_PUBLIC_URL set',
      IS_PROD ? 'FAIL' : 'WARN',
      'not set — using default',
      'Set UPLOAD_PUBLIC_URL=https://api.jebdekho.com/uploads in .env.production',
    );
  }
  try {
    const u = new URL(uploadPublicUrl);
    record(
      'UPLOAD_PUBLIC_URL is https',
      u.protocol === 'https:' ? 'PASS' : 'FAIL',
      u.protocol,
      'Upload URLs must be https for CDN + trusted-upload checks',
    );
  } catch {
    record('UPLOAD_PUBLIC_URL parses', 'FAIL', uploadPublicUrl, 'Not a valid URL');
  }

  // 2) Optional CDN_PUBLIC_URL ----------------------------------------------
  if (!cdnPublicUrl) {
    record(
      'CDN_PUBLIC_URL optional',
      'PASS',
      'empty — uploads served transparently from UPLOAD_PUBLIC_URL (recommended for first rollout)',
    );
  } else {
    try {
      const u = new URL(cdnPublicUrl);
      record(
        'CDN_PUBLIC_URL valid',
        u.protocol === 'https:' ? 'PASS' : 'FAIL',
        cdnPublicUrl,
        'CDN_PUBLIC_URL must be a valid https URL',
      );
      const host = new URL(uploadPublicUrl).host;
      if (u.host !== host) {
        record(
          'CDN_PUBLIC_URL host reachable',
          'WARN',
          `${u.host} differs from upload host ${host} — ensure DNS/proxy exists and next image host allows it`,
          'Add the CDN hostname to NEXT_PUBLIC_UPLOAD_HOST and rebuild the web apps',
        );
      }
    } catch {
      record('CDN_PUBLIC_URL valid', 'FAIL', cdnPublicUrl, 'Not a valid URL');
    }
  }

  // 3) Next.js allowed image hosts ------------------------------------------
  const canonicalHost = (() => {
    try {
      return new URL(uploadPublicUrl).hostname;
    } catch {
      return 'api.jebdekho.com';
    }
  })();
  const uploadHostEnv = process.env.NEXT_PUBLIC_UPLOAD_HOST?.trim();
  const allowedHosts = [canonicalHost, uploadHostEnv].filter(Boolean).join(', ');
  record('Next.js image hosts', 'PASS', `remotePatterns will allow: ${allowedHosts}`);
  if (cdnPublicUrl) {
    const cdnHost = (() => {
      try {
        return new URL(cdnPublicUrl).hostname;
      } catch {
        return '';
      }
    })();
    if (cdnHost && cdnHost !== canonicalHost && cdnHost !== uploadHostEnv) {
      record(
        'CDN host allowed by next/image',
        'FAIL',
        `${cdnHost} not in NEXT_PUBLIC_UPLOAD_HOST`,
        `Set NEXT_PUBLIC_UPLOAD_HOST=${cdnHost} and rebuild web apps, or next/image will reject CDN URLs`,
      );
    }
  }

  // 4) /uploads live checks --------------------------------------------------
  const sampleUrl = firstUploadFileUrl(uploadDir, uploadPublicUrl);
  if (!sampleUrl) {
    record(
      '/uploads live checks',
      'WARN',
      `no sample file found under ${uploadDir} — skipped status/MIME/cache checks`,
    );
  } else {
    try {
      const res = await fetchHead(sampleUrl, { redirect: 'manual' });
      record(
        '/uploads returns 200',
        res.status === 200 ? 'PASS' : 'WARN',
        `${res.status} for ${sampleUrl}`,
        res.status >= 300 && res.status < 400
          ? 'A redirect on an upload can loop through Cloudflare — serve uploads directly (200)'
          : 'Ensure Nginx serves /uploads/ directly',
      );
      const cc = res.headers.get('cache-control') || '';
      record(
        '/uploads Cache-Control',
        /public/.test(cc) && /max-age=\d+/.test(cc) ? 'PASS' : 'WARN',
        cc || '(none)',
        'Expected e.g. "public, max-age=86400, stale-while-revalidate=604800"',
      );
      const nosniff = (res.headers.get('x-content-type-options') || '').toLowerCase();
      record(
        '/uploads nosniff',
        nosniff === 'nosniff' ? 'PASS' : 'WARN',
        nosniff || '(none)',
        'Add "X-Content-Type-Options: nosniff" to the /uploads/ location',
      );
      const ct = res.headers.get('content-type') || '';
      record(
        '/uploads MIME type',
        /^(image|application\/pdf)/.test(ct) ? 'PASS' : 'WARN',
        ct || '(none)',
        'Confirm mime.types is included so images/PDFs get correct Content-Type',
      );
    } catch (e) {
      record('/uploads live checks', 'WARN', `unreachable: ${(e as Error).message}`);
    }
  }

  // 5) HTTPS + redirect-loop behaviour --------------------------------------
  try {
    const res = await fetchHead(apiOrigin + '/health', { redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location') || '';
      const loops = loc.startsWith(apiOrigin) && /^https:/.test(loc);
      record(
        'No HTTPS redirect loop',
        loops ? 'FAIL' : 'WARN',
        `health redirected → ${loc}`,
        'An https→https self-redirect loops behind Cloudflare. Do not force redirects on already-https requests.',
      );
    } else {
      record('No HTTPS redirect loop', 'PASS', `health did not redirect (${res.status})`);
    }
  } catch (e) {
    record('No HTTPS redirect loop', 'WARN', `origin unreachable: ${(e as Error).message}`);
  }

  // 6) API health ------------------------------------------------------------
  try {
    const res = await fetchHead(apiOrigin + '/health', { redirect: 'follow' });
    record(
      'API /health',
      res.ok ? 'PASS' : 'WARN',
      `${res.status} at ${apiOrigin}/health`,
      'Ensure the API is running and /health is excluded from the api/v1 prefix',
    );
  } catch (e) {
    record('API /health', 'WARN', `unreachable: ${(e as Error).message}`);
  }

  // 7) Sensitive API not publicly cacheable ---------------------------------
  try {
    const res = await fetchHead(apiOrigin + '/api/v1', { redirect: 'manual' });
    const cc = (res.headers.get('cache-control') || '').toLowerCase();
    const badlyCached = /\bpublic\b/.test(cc) && /max-age=[1-9]/.test(cc);
    record(
      'API not publicly cached',
      badlyCached ? 'FAIL' : 'PASS',
      cc ? `Cache-Control: ${cc}` : 'no public cache header',
      'Add a Cloudflare cache rule to Bypass /api/* and never emit "public" on API JSON',
    );
  } catch (e) {
    record('API not publicly cached', 'WARN', `unreachable: ${(e as Error).message}`);
  }

  // 8) WebSocket upstream config --------------------------------------------
  const apiConf = join(ROOT, 'deploy/nginx/conf.d/api.jebdekho.com.conf');
  if (existsSync(apiConf)) {
    const conf = readFileSync(apiConf, 'utf8');
    const hasUpgrade = /proxy_set_header\s+Upgrade\s+\$http_upgrade/.test(conf);
    record(
      'WebSocket upstream headers',
      hasUpgrade ? 'PASS' : 'WARN',
      hasUpgrade ? 'Upgrade/Connection forwarded for ws/tracking' : 'no Upgrade header found',
      'Preserve proxy_set_header Upgrade/Connection on ws + tracking locations',
    );
  }

  // 9) Cloudflare real-IP include -------------------------------------------
  const repoRealIp = join(ROOT, 'deploy/nginx/snippets/cloudflare-real-ip.conf');
  const liveRealIp = '/etc/nginx/snippets/cloudflare-real-ip.conf';
  const repoHas = existsSync(repoRealIp);
  const liveHas = existsSync(liveRealIp);
  if (liveHas) {
    record('Cloudflare real-IP include (live)', 'PASS', liveRealIp);
  } else if (repoHas) {
    record(
      'Cloudflare real-IP include',
      'WARN',
      'present in repo but not yet installed to /etc/nginx/snippets',
      'Copy deploy/nginx/snippets/cloudflare-real-ip.conf to /etc/nginx/snippets/ and include it from nginx.conf http{}',
    );
  } else {
    record(
      'Cloudflare real-IP include',
      'FAIL',
      'missing',
      'Run: bash deploy/scripts/update-cloudflare-ips.sh',
    );
  }
  if (repoHas) {
    const body = readFileSync(repoRealIp, 'utf8');
    const ok = /real_ip_header\s+CF-Connecting-IP/.test(body) && /set_real_ip_from/.test(body);
    record(
      'real-IP uses CF-Connecting-IP',
      ok ? 'PASS' : 'FAIL',
      ok ? 'CF-Connecting-IP trusted only from CF ranges' : 'misconfigured',
    );
  }

  // 10) nginx syntax ---------------------------------------------------------
  const canNginx = (() => {
    try {
      execFileSync('nginx', ['-v'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();
  if (!canNginx) {
    record('nginx -t', 'WARN', 'nginx not on PATH — skipped');
  } else if (process.getuid && process.getuid() !== 0) {
    record('nginx -t', 'WARN', 'not root — run `sudo nginx -t` manually');
  } else {
    try {
      execFileSync('nginx', ['-t'], { stdio: 'pipe' });
      record('nginx -t', 'PASS', 'live config valid');
    } catch (e) {
      record('nginx -t', 'FAIL', (e as Error).message.split('\n')[0]);
    }
  }

  // ── summary ───────────────────────────────────────────────────────────────
  const pad = Math.max(...results.map((r) => r.name.length));
  const icon: Record<Status, string> = { PASS: '✅', WARN: '⚠️ ', FAIL: '❌' };
  console.log('\nCloudflare CDN preflight\n' + '─'.repeat(pad + 30));
  for (const r of results) {
    console.log(`${icon[r.status]} ${r.name.padEnd(pad)}  ${r.detail}`);
    if (r.status !== 'PASS' && r.fix) console.log(`   ↳ ${r.fix}`);
  }
  const fails = results.filter((r) => r.status === 'FAIL').length;
  const warns = results.filter((r) => r.status === 'WARN').length;
  console.log('─'.repeat(pad + 30));
  console.log(`PASS ${results.length - fails - warns}  WARN ${warns}  FAIL ${fails}\n`);
  process.exit(fails > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('preflight crashed:', e);
  process.exit(1);
});
