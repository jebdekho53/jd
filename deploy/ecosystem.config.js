/**
 * PM2 ecosystem — JebDekho Production
 * Usage:
 *   cd /var/www/jebdekho
 *   pm2 start deploy/ecosystem.config.js
 *   pm2 save && pm2 startup
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOG_DIR = process.env.JD_LOG_DIR || '/var/log/jebdekho';
const ENV_FILE = path.join(ROOT, '.env.production');

/** Parse KEY=VALUE lines (supports quoted values). */
function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

const productionEnv = {
  ...parseEnvFile(ENV_FILE),
  NODE_ENV: 'production',
};

const appDefaults = {
  cwd: ROOT,
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',
  max_memory_restart: '512M',
  merge_logs: true,
  time: true,
  env: productionEnv,
};

module.exports = {
  apps: [
    {
      ...appDefaults,
      name: 'jebdekho-api',
      script: 'apps/api/dist/main.js',
      cwd: ROOT,
      max_memory_restart: '1G',
      error_file: `${LOG_DIR}/api-error.log`,
      out_file: `${LOG_DIR}/api-out.log`,
    },
    {
      ...appDefaults,
      name: 'jebdekho-buyer-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3000',
      cwd: path.join(ROOT, 'apps/buyer-web'),
      error_file: `${LOG_DIR}/buyer-web-error.log`,
      out_file: `${LOG_DIR}/buyer-web-out.log`,
    },
    {
      ...appDefaults,
      name: 'jebdekho-merchant-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3002',
      cwd: path.join(ROOT, 'apps/merchant-web'),
      error_file: `${LOG_DIR}/merchant-web-error.log`,
      out_file: `${LOG_DIR}/merchant-web-out.log`,
    },
    {
      ...appDefaults,
      name: 'jebdekho-admin-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3003',
      cwd: path.join(ROOT, 'apps/admin-web'),
      error_file: `${LOG_DIR}/admin-web-error.log`,
      out_file: `${LOG_DIR}/admin-web-out.log`,
    },
    {
      ...appDefaults,
      name: 'jebdekho-rider-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3004',
      cwd: path.join(ROOT, 'apps/rider-web'),
      error_file: `${LOG_DIR}/rider-web-error.log`,
      out_file: `${LOG_DIR}/rider-web-out.log`,
    },
    {
      ...appDefaults,
      name: 'jebdekho-vendor-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3005',
      cwd: path.join(ROOT, 'apps/vendor-web'),
      error_file: `${LOG_DIR}/vendor-web-error.log`,
      out_file: `${LOG_DIR}/vendor-web-out.log`,
    },
    {
      ...appDefaults,
      name: 'jebdekho-franchise-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3006',
      cwd: path.join(ROOT, 'apps/franchise-web'),
      error_file: `${LOG_DIR}/franchise-web-error.log`,
      out_file: `${LOG_DIR}/franchise-web-out.log`,
    },
  ],
};
