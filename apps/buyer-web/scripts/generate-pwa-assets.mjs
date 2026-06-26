#!/usr/bin/env node
/**
 * Generates PWA icons, splash screens, and screenshots from public/logo.png.
 * Optional — committed assets under public/pwa/ are used when sharp is unavailable.
 */
import { access } from 'node:fs/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const logoPath = path.join(root, 'public/logo.png');
const iconsDir = path.join(root, 'public/pwa/icons');
const splashDir = path.join(root, 'public/pwa/splash');
const shotsDir = path.join(root, 'public/pwa/screenshots');
const markerIcon = path.join(iconsDir, 'icon-192.png');

async function hasCommittedAssets() {
  try {
    await access(markerIcon);
    return true;
  } catch {
    return false;
  }
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  if (await hasCommittedAssets()) {
    console.log('sharp not installed — using committed PWA assets in public/pwa/');
    process.exit(0);
  }
  console.error(
    'sharp is required to generate PWA assets. Run: pnpm add -D sharp (in apps/buyer-web)',
  );
  process.exit(1);
}

const GREEN = '#16a34a';
const GREEN_DARK = '#15803d';

const ICON_SIZES = [72, 96, 128, 144, 152, 180, 192, 256, 384, 512];

async function ensureDirs() {
  await mkdir(iconsDir, { recursive: true });
  await mkdir(splashDir, { recursive: true });
  await mkdir(shotsDir, { recursive: true });
}

async function iconBuffer(size, padding = 0.12) {
  const inner = Math.round(size * (1 - padding * 2));
  const logo = await sharp(logoPath).resize(inner, inner, { fit: 'contain' }).png().toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 22, g: 163, b: 74, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function maskableBuffer(size) {
  const inner = Math.round(size * 0.55);
  const logo = await sharp(logoPath).resize(inner, inner, { fit: 'contain' }).png().toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 22, g: 163, b: 74, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function monochromeBuffer(size) {
  const inner = Math.round(size * 0.7);
  const logo = await sharp(logoPath)
    .resize(inner, inner, { fit: 'contain' })
    .greyscale()
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function splash(width, height, filename) {
  const logoSize = Math.min(width, height) * 0.22;
  const logo = await sharp(logoPath)
    .resize(Math.round(logoSize), Math.round(logoSize), { fit: 'contain' })
    .png()
    .toBuffer();

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${GREEN}"/>
          <stop offset="100%" style="stop-color:${GREEN_DARK}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <text x="50%" y="${height * 0.72}" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="${Math.round(width * 0.055)}" font-weight="700">JebDekho</text>
      <text x="50%" y="${height * 0.78}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="system-ui,sans-serif" font-size="${Math.round(width * 0.028)}">Compare prices. Save more.</text>
    </svg>`;

  await sharp(Buffer.from(svg))
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(path.join(splashDir, filename));
}

async function screenshot(width, height, filename, label) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f9fafb"/>
      <rect x="0" y="0" width="100%" height="80" fill="${GREEN}"/>
      <text x="32" y="52" fill="white" font-family="system-ui" font-size="28" font-weight="700">JebDekho</text>
      <text x="32" y="140" fill="#111827" font-family="system-ui" font-size="36" font-weight="700">${label}</text>
      <rect x="32" y="180" width="${width - 64}" height="120" rx="16" fill="white" stroke="#e5e7eb"/>
      <rect x="32" y="320" width="${width - 64}" height="120" rx="16" fill="white" stroke="#e5e7eb"/>
    </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(shotsDir, filename));
}

async function main() {
  await ensureDirs();

  for (const size of ICON_SIZES) {
    const buf = await iconBuffer(size);
    await sharp(buf).toFile(path.join(iconsDir, `icon-${size}.png`));
  }

  for (const size of [192, 512]) {
    const buf = await maskableBuffer(size);
    await sharp(buf).toFile(path.join(iconsDir, `icon-${size}-maskable.png`));
  }

  const mono = await monochromeBuffer(192);
  await sharp(mono).toFile(path.join(iconsDir, 'icon-192-monochrome.png'));

  await sharp(await iconBuffer(180)).toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  await sharp(await iconBuffer(48)).toFile(path.join(root, 'public/favicon.ico'));

  // Legacy paths used elsewhere
  await sharp(await iconBuffer(192)).toFile(path.join(root, 'public/icon-192.png'));
  await sharp(await iconBuffer(512)).toFile(path.join(root, 'public/icon-512.png'));

  await splash(1170, 2532, 'iphone-15-pro.png');
  await splash(1170, 2532, 'iphone-14.png');
  await splash(1170, 2532, 'iphone-13.png');
  await splash(1125, 2436, 'iphone-x.png');
  await splash(1536, 2048, 'ipad.png');
  await splash(1920, 1080, 'desktop.png');
  await splash(1080, 1920, 'android.png');

  await screenshot(390, 844, 'home-mobile.png', 'Compare prices');
  await screenshot(1280, 720, 'home-desktop.png', 'Shop local stores');

  await writeFile(
    path.join(iconsDir, 'safari-pinned-tab.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#16a34a"/></svg>`,
  );

  console.log('PWA assets generated in public/pwa/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
