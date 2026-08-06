import Link from 'next/link';
import type { ReactNode } from 'react';

const SUPPORT_EMAIL = 'support@jebdekho.com';

function Wordmark() {
  return (
    <span className="text-lg font-extrabold tracking-tight">
      <span className="text-white">Jeb</span>
      <span className="text-emerald-400">Dekho</span>
      <span className="ml-2 align-middle text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Franchise
      </span>
    </span>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-5">
            <Link href="/#how-it-works" className="hidden text-slate-400 hover:text-white sm:inline">
              How it works
            </Link>
            <Link href="/#faq" className="hidden text-slate-400 hover:text-white sm:inline">
              FAQ
            </Link>
            <Link href="/login" className="text-slate-300 hover:text-white">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Apply now
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-10 px-4 text-sm sm:px-6">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-3 text-slate-400">
              Bring local stores online in your city and earn a share of every order they fulfil.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-slate-400">
            <span className="mb-1 font-semibold text-slate-200">Program</span>
            <Link href="/#how-it-works" className="hover:text-white">
              How it works
            </Link>
            <Link href="/#faq" className="hover:text-white">
              FAQ
            </Link>
            <Link href="/signup" className="hover:text-white">
              Apply for a franchise
            </Link>
          </div>
          <div className="flex flex-col gap-2 text-slate-400">
            <span className="mb-1 font-semibold text-slate-200">Partners</span>
            <Link href="/login" className="hover:text-white">
              Partner login
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white">
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div className="flex flex-col gap-2 text-slate-400">
            <span className="mb-1 font-semibold text-slate-200">Legal</span>
            <a href="https://jebdekho.com/terms" className="hover:text-white">
              Terms
            </a>
            <a href="https://jebdekho.com/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="https://jebdekho.com/contact" className="hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
