const WHATSAPP_NUMBER = '917348245145';

function whatsappLink(): string {
  return `https://wa.me/${WHATSAPP_NUMBER}`;
}

/** Floating WhatsApp CTA shown across every merchant marketing page (landing,
 *  features, pricing, signup, onboarding-status) via MarketingShell — opens a
 *  blank chat with the recruitment number. No pre-filled text: identical
 *  boilerplate arriving from many different senders is a pattern WhatsApp's
 *  spam detection can flag on the receiving number. */
export function WhatsAppCtaButton() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[#1ebe5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
        <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.5 1.34 5.02L2 22l5.13-1.35a10 10 0 0 0 4.91 1.28h.01c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.15h-.01a8.14 8.14 0 0 1-4.15-1.14l-.3-.18-3.05.8.81-2.97-.19-.3a8.15 8.15 0 1 1 14.9-4.51 8.15 8.15 0 0 1-8.01 8.3Zm4.47-6.1c-.24-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
      </svg>
      WhatsApp पर बात करें
    </a>
  );
}
