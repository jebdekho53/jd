import { PRODUCTION_URLS, getApiOrigin } from '@jebdekho/web-config';

const BFF_ROUTES = [
  { method: 'POST', path: '/api/auth/request-otp', desc: 'Request login OTP' },
  { method: 'POST', path: '/api/auth/verify-otp', desc: 'Verify OTP & issue session' },
  { method: 'GET', path: '/api/rider/me', desc: 'Rider profile' },
  { method: 'PATCH', path: '/api/rider/status', desc: 'Online / offline toggle' },
  { method: 'PATCH', path: '/api/rider/location', desc: 'GPS location ping' },
  { method: 'GET', path: '/api/rider/orders', desc: 'Assigned deliveries' },
  { method: 'PATCH', path: '/api/rider/orders/:id/accept', desc: 'Accept delivery' },
  { method: 'PATCH', path: '/api/rider/orders/:id/delivered', desc: 'Mark delivered' },
  { method: 'GET', path: '/api/rider/earnings/today', desc: "Today's earnings" },
  { method: 'GET', path: '/api/rider/fleet/queue', desc: 'Fleet batch queue' },
  { method: 'GET', path: '/api/rider/fleet/route', desc: 'Optimized route view' },
];

const APPS = [
  { name: 'Buyer', port: 3000, href: PRODUCTION_URLS.buyer },
  { name: 'Merchant', port: 3002, href: PRODUCTION_URLS.merchant },
  { name: 'Admin', port: 3003, href: PRODUCTION_URLS.admin },
  { name: 'Rider BFF', port: 3004, href: PRODUCTION_URLS.rider, current: true },
];

async function getApiStatus(): Promise<'online' | 'offline'> {
  try {
    const res = await fetch(`${getApiOrigin()}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return res.ok ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

export default async function Home() {
  const apiStatus = await getApiStatus();

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '48px 24px 64px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          padding: '6px 12px',
          borderRadius: 999,
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          fontSize: 12,
          fontWeight: 600,
          color: '#7dd3fc',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Port 3004 · Rider BFF
      </div>

      <h1
        style={{
          margin: '0 0 12px',
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#f8fafc',
        }}
      >
        JebDekho Rider API Gateway
      </h1>

      <p style={{ margin: '0 0 28px', fontSize: 16, lineHeight: 1.6, color: '#94a3b8' }}>
        This is the <strong style={{ color: '#e2e8f0' }}>Backend-for-Frontend</strong> for the
        rider mobile app (Expo). It proxies authenticated requests to the NestJS API — not a
        full rider dashboard UI.
      </p>

      <div
        style={{
          display: 'grid',
          gap: 12,
          marginBottom: 32,
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        }}
      >
        <StatusCard label="BFF" value="Running" tone="ok" />
        <StatusCard
          label="API"
          value={apiStatus === 'online' ? 'Online' : 'Offline'}
          tone={apiStatus === 'online' ? 'ok' : 'error'}
        />
        <StatusCard
          label="Backend"
          value={getApiOrigin().replace(/^https?:\/\//, '')}
          tone="neutral"
        />
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={sectionTitle}>Local dev apps</h2>
        <p style={sectionDesc}>
          Looking for Admin? Use port <strong>3003</strong>, not 3004.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {APPS.map((app) => (
            <a
              key={app.port}
              href={app.href}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                border: app.current
                  ? '1px solid #38bdf8'
                  : '1px solid rgba(148, 163, 184, 0.25)',
                background: app.current ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                color: app.current ? '#7dd3fc' : '#cbd5e1',
              }}
            >
              {app.name} :{app.port}
            </a>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={sectionTitle}>BFF routes</h2>
        <p style={sectionDesc}>
          Used by <code style={codeStyle}>@jebdekho/rider-mobile</code> via{' '}
          <code style={codeStyle}>EXPO_PUBLIC_BFF_URL={PRODUCTION_URLS.rider}</code>
        </p>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            borderRadius: 12,
            border: '1px solid rgba(148, 163, 184, 0.15)',
            overflow: 'hidden',
          }}
        >
          {BFF_ROUTES.map((route, i) => (
            <li
              key={route.path}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'baseline',
                padding: '12px 16px',
                fontSize: 13,
                borderTop: i === 0 ? undefined : '1px solid rgba(148, 163, 184, 0.1)',
                background: i % 2 === 0 ? 'rgba(15, 23, 42, 0.4)' : 'transparent',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  color: route.method === 'GET' ? '#4ade80' : '#fbbf24',
                  minWidth: 44,
                }}
              >
                {route.method}
              </span>
              <code style={{ ...codeStyle, flex: 1 }}>{route.path}</code>
              <span style={{ color: '#64748b', fontSize: 12 }}>{route.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={sectionTitle}>Quick start</h2>
        <pre
          style={{
            margin: 0,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            fontSize: 13,
            lineHeight: 1.6,
            overflowX: 'auto',
            color: '#cbd5e1',
          }}
        >
{`# Run rider BFF only
pnpm --filter @jebdekho/rider-web dev

# API health
curl ${getApiOrigin()}/health`}
        </pre>
      </section>
    </main>
  );
}

const sectionTitle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#94a3b8',
};

const sectionDesc: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 14,
  lineHeight: 1.5,
  color: '#64748b',
};

const codeStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  color: '#e2e8f0',
};

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'ok' | 'error' | 'neutral';
}) {
  const colors = {
    ok: { dot: '#4ade80', border: 'rgba(74, 222, 128, 0.3)' },
    error: { dot: '#f87171', border: 'rgba(248, 113, 113, 0.3)' },
    neutral: { dot: '#94a3b8', border: 'rgba(148, 163, 184, 0.2)' },
  }[tone];

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        background: 'rgba(15, 23, 42, 0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: colors.dot,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{value}</p>
    </div>
  );
}
