'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Shield, Store, ShoppingBag, Bike, Users } from 'lucide-react';
import { Button, Input, useToast } from '@/design-system';
import { BrandLockup } from '@/components/brand/brand-lockup';
import { useLoginMutation, useLoginStatsQuery, useSessionQuery } from '@/hooks/use-auth';
import { isAdminUser } from '@/types/admin';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: session } = useSessionQuery();
  const { data: stats } = useLoginStatsQuery();
  const login = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (searchParams.get('error') === 'not_admin') {
      toast('Access denied. Admin role required.', 'error');
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (session && isAdminUser(session)) {
      const next = searchParams.get('next') ?? '/dashboard';
      window.location.href = next;
    }
  }, [session, searchParams]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const result = await login.mutateAsync({ email: email.trim(), password, rememberMe });
      if (!isAdminUser(result.user)) {
        toast('This account does not have admin access.', 'error');
        return;
      }
      toast('Signed in successfully', 'success');
      window.location.href = searchParams.get('next') ?? '/dashboard';
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('too many')) {
        toast(msg, 'error');
      } else if (msg.toLowerCase().includes('disabled')) {
        toast('Account is disabled. Contact platform security.', 'error');
      } else {
        toast('Invalid email or password', 'error');
      }
    }
  };

  const statCards = [
    { label: 'Active Stores', value: formatCount(stats?.activeStores ?? 0), icon: Store },
    { label: 'Total Orders', value: formatCount(stats?.totalOrders ?? 0), icon: ShoppingBag },
    { label: 'Active Riders', value: formatCount(stats?.activeRiders ?? 0), icon: Bike },
    { label: 'Merchants', value: formatCount(stats?.merchants ?? 0), icon: Users },
  ];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left panel */}
      <div className="relative flex flex-1 flex-col justify-between bg-gradient-to-br from-slate-900 via-admin-900 to-slate-950 p-8 text-white lg:p-12">
        <div>
          <div className="mb-10">
            <BrandLockup subtitle="Admin Control Tower" inverted className="gap-3" />
          </div>

          <h1 className="max-w-md text-3xl font-bold leading-tight lg:text-4xl">
            Enterprise platform operations, secured.
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/70 lg:text-base">
            Manage finance, GST, trust &amp; safety, CRM, fleet, franchise, procurement, and support from one control tower.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {statCards.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center gap-2 text-white/70">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {[
            { icon: Shield, label: 'JWT + HttpOnly Cookies' },
            { icon: Lock, label: 'Account Lockout Protection' },
            { icon: Shield, label: 'Session Audit Logs' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center bg-surface p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin-800 text-sm font-bold text-white">
                JD
              </div>
              <span className="font-semibold text-slate-900">Admin Control Tower</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Authorized personnel only</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="admin@jebdekho.com"
              error={errors.email}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="••••••••"
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-admin-700 focus:ring-admin-500"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="font-medium text-admin-700 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={login.isPending}>
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Protected by enterprise authentication. All access is logged.
          </p>
        </div>
      </div>
    </div>
  );
}
