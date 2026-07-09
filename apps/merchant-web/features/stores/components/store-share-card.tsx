'use client';

import { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Check, Share2, Download, MessageCircle } from 'lucide-react';
import { Card, CardHeader, CardBody, Button } from '@/design-system/primitives';

interface StoreShareCardProps {
  slug: string;
  name: string;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jebdekho.com').replace(/\/$/, '');

export function StoreShareCard({ slug, name }: StoreShareCardProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const url = useMemo(() => `${SITE_URL}/store/${slug}`, [slug]);
  const waMessage = useMemo(
    () =>
      `Namaste! 🙏 Ab aap *${name}* se online order kar sakte hain — seedhe ghar tak delivery.\n\nYahan order karein: ${url}`,
    [name, url],
  );
  const waHref = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — user can still select the text */
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: name,
          text: `Order from ${name} online`,
          url,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      void copyLink();
    }
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${slug}-jebdekho-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold">Share your store &amp; get more orders</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Send this link to your customers on WhatsApp, or print the QR code for your shop counter.
          Every order that comes through it costs you nothing extra to acquire.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Shareable link */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700"
            aria-label="Your store link"
          />
          <Button type="button" variant="outline" onClick={copyLink}>
            {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>

        {/* Share actions */}
        <div className="flex flex-wrap gap-2">
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <Button type="button" className="bg-[#25D366] hover:bg-[#1ebe57] text-white">
              <MessageCircle className="mr-2 h-4 w-4" />
              Share on WhatsApp
            </Button>
          </a>
          <Button type="button" variant="outline" onClick={nativeShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share…
          </Button>
        </div>

        {/* QR code */}
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 p-4 sm:flex-row sm:items-center">
          <div ref={qrRef} className="rounded-lg bg-white p-2">
            <QRCodeCanvas value={url} size={132} level="M" includeMargin />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-slate-700">Scan to order</p>
            <p className="mb-2 text-xs text-slate-500">
              Print and stick this at your counter or on bills. Walk-in customers scan it and become
              repeat online customers.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={downloadQr}>
              <Download className="mr-2 h-4 w-4" />
              Download QR
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
