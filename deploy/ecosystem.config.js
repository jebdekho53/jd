/**
 * PM2 ecosystem — JebDekho Production
 * Usage:
 *   cd /var/www/jebdekho
 *   pm2 start deploy/ecosystem.config.js
 *   pm2 save && pm2 startup
 *
 * Node 20+ loads .env.production via --env-file (reliable PEM / quoted URLs).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOG_DIR = process.env.JD_LOG_DIR || '/var/log/jebdekho';
const ENV_FILE = path.join(ROOT, '.env.production');

if (!fs.existsSync(ENV_FILE)) {
  console.error(`ERROR: ${ENV_FILE} not found — copy from .env.production.example`);
  process.exit(1);
}

const nodeEnvFile = `--env-file=${ENV_FILE}`;

const appDefaults = {
  cwd: ROOT,
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
  max_restarts: 15,
  min_uptime: '10s',
  max_memory_restart: '512M',
  merge_logs: true,
  time: true,
  node_args: nodeEnvFile,
  env: {
    NODE_ENV: 'production',
  },
};

module.exports = {
  apps: [
    {
      ...appDefaults,
      name: 'jebdekho-api',
      // pnpm: run from apps/api so node_modules resolve (not from monorepo root)
      script: 'dist/main.js',
      cwd: path.join(ROOT, 'apps/api'),
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
