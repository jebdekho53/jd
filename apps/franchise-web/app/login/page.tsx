import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata = { title: 'Partner Login — JebDekho Franchise' };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="w-full max-w-md">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">
          JebDekho
        </p>
        <h1 className="text-3xl font-bold">Partner login</h1>
        <p className="mt-2 text-sm text-slate-400">
          For approved JebDekho franchise partners.
        </p>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-slate-400">
          Not a partner yet?{' '}
          <a href="/" className="font-semibold text-emerald-300 hover:text-emerald-200">
            Apply for a franchise
          </a>
        </p>
      </section>
    </main>
  );
}
