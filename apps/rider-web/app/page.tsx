const SUPPORT_EMAIL = 'support@jebdekho.com';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="w-full max-w-xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-300">
          JebDekho
        </p>
        <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">Coming Soon</h1>
        <p className="mt-5 text-base leading-7 text-slate-300">
          Rider partner access is private and available only to approved JebDekho partners.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="https://jebdekho.com"
            className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Back to JebDekho
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </section>
    </main>
  );
}
