import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata = { title: 'Vendor Login — JebDekho' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="w-full max-w-md">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-300">
          JebDekho
        </p>
        <h1 className="text-3xl font-bold">Vendor login</h1>
        <p className="mt-2 text-sm text-slate-400">
          For approved JebDekho supply-chain vendors.
        </p>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-slate-400">
          Not a vendor yet?{' '}
          <a href="/apply" className="font-semibold text-violet-300 hover:text-violet-200">
            Apply to become a vendor
          </a>
        </p>
      </section>
    </main>
  );
}
