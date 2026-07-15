import { Injectable } from '@nestjs/common';
import type sharp from 'sharp';
import * as QRCode from 'qrcode';

export interface MarketingCardInput {
  /** Big name line — person or store owner. */
  name: string;
  /** Role under the name, e.g. "Business Development Partner". */
  roleTitle: string;
  /** Orange pill label, e.g. "Lucknow Franchise Partner" / "JebDekho Store". */
  pillLabel: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  /** Full address; wraps onto two lines if long. */
  address?: string | null;
  /** What the QR encodes (invite link for franchise, store link for merchant). */
  qrUrl: string;
  /** Caption under the QR, e.g. "Scan to Connect" / "Scan to Shop". */
  qrCaption: string;
  /** Owner/store photo (raw image bytes). Optional — a placeholder is drawn if absent. */
  photo?: Buffer | null;
}

const W = 1080;
const H = 1120;
const TOP_H = 610; // white business-card panel
const NAVY = '#0E2C4E';
const NAVY_2 = '#0A2038';
const ORANGE = '#F47C20';
const WHITE = '#FFFFFF';
const SLATE = '#5B6B7D';

/**
 * Renders the branded, shareable JebDekho partner card (PNG): a business-card
 * panel (photo, contacts, QR) over a marketing banner. One source of truth —
 * the same PNG is served to the dashboard download button and attached to the
 * approval welcome email.
 */
@Injectable()
export class MarketingCardService {
  /** sharp is a native module; load it the same defensive way the rest of the API does. */
  private async loadSharp(): Promise<typeof sharp> {
    const mod: any = await import('sharp');
    return mod.default ?? mod;
  }

  async render(input: MarketingCardInput): Promise<Buffer> {
    const sharp = await this.loadSharp();
    // Photo panel (right side of the business card, on the orange swoosh).
    const photoBox = { x: 812, y: 96, w: 226, h: 300 };
    // QR (center of the business card).
    const qrSize = 210;
    const qr = { x: 470, y: 150, size: qrSize };

    const [qrPng, photoRounded] = await Promise.all([
      QRCode.toBuffer(input.qrUrl, {
        margin: 1,
        width: qrSize,
        color: { dark: NAVY, light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      }),
      this.roundPhoto(sharp, input.photo, photoBox.w, photoBox.h),
    ]);

    const svg = this.buildSvg(input, photoBox);
    const composites: sharp.OverlayOptions[] = [{ input: qrPng, top: qr.y, left: qr.x }];
    if (photoRounded) composites.push({ input: photoRounded, top: photoBox.y, left: photoBox.x });

    return sharp(Buffer.from(svg)).composite(composites).png().toBuffer();
  }

  /** Cover-crop the photo to the box with rounded corners; null if no photo. */
  private async roundPhoto(sharp: typeof import('sharp'), photo: Buffer | null | undefined, w: number, h: number): Promise<Buffer | null> {
    if (!photo) return null;
    const mask = Buffer.from(
      `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="20" ry="20" fill="#fff"/></svg>`,
    );
    try {
      return await sharp(photo)
        .resize(w, h, { fit: 'cover', position: 'attention' })
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toBuffer();
    } catch {
      return null;
    }
  }

  private buildSvg(input: MarketingCardInput, photoBox: { x: number; y: number; w: number; h: number }): string {
    const e = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
    const fullName = this.clamp(input.name, 26);
    const [first, ...rest] = fullName.split(' ');
    const nameFirst = e(first ?? '');
    const nameRest = e(rest.join(' '));
    // Shrink the name so it never runs under the QR panel (which starts at x=450).
    const nameFont = fullName.length <= 16 ? 40 : fullName.length <= 20 ? 30 : fullName.length <= 24 ? 25 : 22;
    const role = e(this.clamp(input.roleTitle, 34));
    const pill = e(this.clamp(input.pillLabel, 30));
    const caption = e(this.clamp(input.qrCaption, 18));
    const addrLines = this.wrap(input.address ?? '', 32, 3).map(e);
    const font = `font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif"`;
    const hasPhoto = !!input.photo;

    // Contact rows (icon + text), stacked on the left.
    const rows: Array<{ icon: string; lines: string[] }> = [];
    if (input.phone) rows.push({ icon: 'phone', lines: [e(input.phone)] });
    if (input.whatsapp) rows.push({ icon: 'wa', lines: [e(input.whatsapp)] });
    if (input.email) rows.push({ icon: 'mail', lines: [e(this.clamp(input.email, 34))] });
    if (addrLines.length) rows.push({ icon: 'pin', lines: addrLines });

    let cy = 322;
    const rowSvg = rows
      .map((r) => {
        const block = this.iconSvg(r.icon, 44, cy - 16) + r.lines
          .map((ln, i) => `<text x="82" y="${cy + i * 26}" ${font} font-size="21" fill="${NAVY}">${ln}</text>`)
          .join('');
        cy += 26 * r.lines.length + 16;
        return block;
      })
      .join('');

    const pillW = Math.min(430, 60 + pill.length * 15);

    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="navy" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${NAVY_2}"/>
    </linearGradient>
    <clipPath id="topclip"><rect x="0" y="0" width="${W}" height="${TOP_H}"/></clipPath>
  </defs>

  <!-- ===== TOP: business card (white) ===== -->
  <rect x="0" y="0" width="${W}" height="${TOP_H}" fill="${WHITE}"/>
  <rect x="0" y="0" width="${W}" height="12" fill="${ORANGE}"/>
  <!-- orange swoosh behind the photo -->
  <g clip-path="url(#topclip)">
    <path d="M ${W} 0 L ${W} ${TOP_H} L 690 ${TOP_H} C 760 ${TOP_H - 150}, 770 120, ${W} 40 Z" fill="${ORANGE}"/>
    <path d="M ${W} 0 L ${W} ${TOP_H} L 740 ${TOP_H} C 810 ${TOP_H - 130}, 830 150, ${W} 70 Z" fill="${NAVY}" opacity="0.10"/>
  </g>

  <!-- logo + tagline -->
  <text x="44" y="78" ${font} font-size="46" font-weight="bold" fill="${NAVY}">jeb<tspan fill="${ORANGE}">dekho</tspan></text>
  <text x="46" y="106" ${font} font-size="17" fill="${SLATE}">Local Stores. Great Choices. Near You.</text>

  <!-- proud partner -->
  <text x="470" y="60" ${font} font-size="18" fill="${SLATE}" text-anchor="middle">Proud Partner of</text>
  <text x="470" y="86" ${font} font-size="21" font-weight="bold" fill="${ORANGE}" text-anchor="middle">UrbanMove Services Pvt. Ltd.</text>

  <!-- name + role + pill -->
  <text x="44" y="196" ${font} font-size="${nameFont}" font-weight="bold" fill="${NAVY}">${nameFirst} <tspan fill="${ORANGE}">${nameRest}</tspan></text>
  <text x="46" y="228" ${font} font-size="22" fill="${NAVY}">${role}</text>
  <rect x="44" y="248" width="${pillW}" height="40" rx="8" fill="${ORANGE}"/>
  <text x="${44 + pillW / 2}" y="275" ${font} font-size="20" font-weight="bold" fill="${WHITE}" text-anchor="middle">${pill}</text>

  <!-- contact rows -->
  ${rowSvg}

  <!-- QR -->
  <rect x="450" y="130" width="250" height="250" rx="16" fill="${WHITE}" stroke="#E3E8EE" stroke-width="2"/>
  <rect x="475" y="398" width="200" height="36" rx="18" fill="${NAVY}"/>
  <text x="575" y="422" ${font} font-size="18" font-weight="bold" fill="${WHITE}" text-anchor="middle">${caption}</text>
  <text x="575" y="466" ${font} font-size="18" fill="${SLATE}" text-anchor="middle">www.jebdekho.com</text>

  ${hasPhoto ? '' : this.photoPlaceholder(photoBox)}

  <!-- ===== BOTTOM: marketing banner (navy) ===== -->
  <rect x="0" y="${TOP_H}" width="${W}" height="${H - TOP_H}" fill="url(#navy)"/>
  ${this.skyline()}
  <text x="44" y="${TOP_H + 78}" ${font} font-size="30" fill="#C7D4E0">Grow Your Business with</text>
  <text x="44" y="${TOP_H + 126}" ${font} font-size="54" font-weight="bold" fill="${WHITE}">Jeb<tspan fill="${ORANGE}">Dekho</tspan></text>
  <text x="46" y="${TOP_H + 158}" ${font} font-size="18" fill="#8FA3B8" letter-spacing="1">— Join the Future of Local Commerce</text>

  ${this.features(TOP_H + 40)}

  <rect x="44" y="${TOP_H + 200}" width="420" height="60" rx="10" fill="rgba(255,255,255,0.06)" stroke="${ORANGE}" stroke-width="1"/>
  <text x="66" y="${TOP_H + 228}" ${font} font-size="18" fill="#C7D4E0">📍 We are building a stronger</text>
  <text x="66" y="${TOP_H + 250}" ${font} font-size="18" fill="#C7D4E0">local market, together.</text>

  <text x="770" y="${TOP_H + 214}" ${font} font-size="24" font-weight="bold" fill="${WHITE}" text-anchor="middle">Be a part of Lucknow’s</text>
  <text x="770" y="${TOP_H + 246}" ${font} font-size="24" font-weight="bold" fill="${ORANGE}" text-anchor="middle">Digital Shopping Revolution!</text>

  <rect x="150" y="${H - 80}" width="780" height="50" rx="25" fill="${ORANGE}"/>
  <text x="540" y="${H - 48}" ${font} font-size="21" font-weight="bold" fill="${NAVY_2}" text-anchor="middle">Local Dukaan, Global Pehchaan — JebDekho ke Saath!</text>
</svg>`;
  }

  /** Small monochrome contact icons drawn as simple vector marks. */
  private iconSvg(kind: string, x: number, y: number): string {
    const c = ORANGE;
    const wrap = (inner: string) =>
      `<g transform="translate(${x},${y})"><circle cx="15" cy="15" r="15" fill="${c}"/><g fill="#fff" stroke="#fff">${inner}</g></g>`;
    switch (kind) {
      case 'phone':
        return wrap(`<path d="M10 9 q0 -1 1 -1 l3 0 q1 0 1 1 l0.5 3 q0 1 -1 1 l-1.5 0.5 q1.5 3 4 4 l0.5 -1.5 q0.5 -1 1 -1 l3 0.5 q1 0 1 1 l0 3 q0 1 -1 1 q-8 0 -13 -13 z" stroke="none"/>`);
      case 'wa':
        return wrap(`<path d="M15 7 a8 8 0 1 0 4 15 l4 1 -1 -4 a8 8 0 0 0 -7 -12 z" fill="none" stroke-width="2"/><path d="M12 13 q0 6 6 6 q2 0 2 -1.5 l-2 -1 -1 1 q-2 -1 -3 -3 l1 -1 -1 -2 q-1.5 0 -1.5 1.5 z" stroke="none"/>`);
      case 'mail':
        return wrap(`<rect x="8" y="10" width="14" height="10" rx="1.5" fill="none" stroke-width="2"/><path d="M8 11 l7 5 l7 -5" fill="none" stroke-width="2"/>`);
      case 'pin':
        return wrap(`<path d="M15 7 a6 6 0 0 1 6 6 q0 5 -6 10 q-6 -5 -6 -10 a6 6 0 0 1 6 -6 z" fill="none" stroke-width="2"/><circle cx="15" cy="13" r="2.4" stroke="none"/>`);
      default:
        return '';
    }
  }

  private photoPlaceholder(b: { x: number; y: number; w: number; h: number }): string {
    const cx = b.x + b.w / 2;
    return `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="20" fill="rgba(255,255,255,0.22)"/>
      <circle cx="${cx}" cy="${b.y + 110}" r="52" fill="rgba(255,255,255,0.6)"/>
      <path d="M ${cx - 78} ${b.y + b.h - 18} q78 -110 156 0 z" fill="rgba(255,255,255,0.6)"/>
      <text x="${cx}" y="${b.y + b.h - 34}" font-family="DejaVu Sans, sans-serif" font-size="16" fill="${NAVY}" text-anchor="middle">Your photo</text>`;
  }

  private features(y: number): string {
    const items = [
      { label1: 'Online Store', label2: 'Presence' },
      { label1: 'Hyperlocal', label2: 'Delivery' },
      { label1: 'More', label2: 'Customers' },
      { label1: 'Easy Order', label2: 'Management' },
      { label1: 'Dedicated', label2: 'Support' },
    ];
    const startX = 540;
    const gap = 108;
    const font = `font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif"`;
    return items
      .map((it, i) => {
        const cx = startX + i * gap;
        const fill = i % 2 === 0 ? ORANGE : '#16406b';
        return `<circle cx="${cx}" cy="${y + 30}" r="30" fill="${fill}"/>
          <circle cx="${cx}" cy="${y + 30}" r="12" fill="none" stroke="#fff" stroke-width="2.5"/>
          <text x="${cx}" y="${y + 78}" ${font} font-size="14" font-weight="bold" fill="#DCE6F0" text-anchor="middle">${it.label1}</text>
          <text x="${cx}" y="${y + 96}" ${font} font-size="14" font-weight="bold" fill="#DCE6F0" text-anchor="middle">${it.label2}</text>`;
      })
      .join('');
  }

  private skyline(): string {
    // Faint city silhouette along the bottom band.
    return `<g fill="#ffffff" opacity="0.04"><rect x="60" y="${H - 150}" width="40" height="120"/><rect x="120" y="${H - 190}" width="30" height="160"/><rect x="170" y="${H - 130}" width="50" height="100"/><rect x="900" y="${H - 170}" width="34" height="140"/><rect x="950" y="${H - 140}" width="44" height="110"/><rect x="1010" y="${H - 200}" width="30" height="170"/></g>`;
  }

  private clamp(s: string, max: number): string {
    const t = (s ?? '').trim();
    return t.length > max ? `${t.slice(0, max - 1)}…` : t;
  }

  private wrap(s: string, per: number, maxLines: number): string[] {
    const words = (s ?? '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > per) {
        lines.push(cur.trim());
        cur = w;
        if (lines.length === maxLines - 1) break;
      } else cur = (cur + ' ' + w).trim();
    }
    const used = lines.join(' ').split(/\s+/).filter(Boolean).length;
    const rem = words.slice(used).join(' ');
    if (rem) lines.push(rem.length > per ? `${rem.slice(0, per - 1)}…` : rem);
    return lines.slice(0, maxLines);
  }
}
