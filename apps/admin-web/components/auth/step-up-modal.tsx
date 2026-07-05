'use client';

import { useState, useEffect, useRef } from 'react';
import { useUiModalsStore } from '@/store/ui-modals-store';
import { useSessionQuery } from '@/hooks/use-auth';
import { Modal, Button, Input, useToast } from '@/design-system';
import { adminFetch } from '@/services/api/admin-client';

type Method = 'password' | 'otp';

export function StepUpModal() {
  const { stepUpOpen, resolveStepUp } = useUiModalsStore();
  const { data: session } = useSessionQuery();
  const { toast } = useToast();

  const [method, setMethod] = useState<Method>('password');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stepUpOpen) {
      setMethod('password');
      setPassword('');
      setOtp('');
      setOtpSent(false);
      setCountdown(0);
      setError(null);
      setTimeout(() => passwordRef.current?.focus(), 150);
    }
  }, [stepUpOpen]);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  if (!stepUpOpen) return null;

  const handleSendOtp = async () => {
    if (!session?.phone) {
      setError('Phone number not found in profile');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminFetch('/api/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: session.phone, deviceName: 'admin-web' }),
      });
      setOtpSent(true);
      setCountdown(60);
      toast('OTP sent to your phone', 'success');
      setTimeout(() => otpRef.current?.focus(), 100);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: any = {};
    if (method === 'password') {
      if (!password) {
        setError('Password is required');
        setLoading(false);
        return;
      }
      payload.password = password;
    } else {
      if (!otp) {
        setError('OTP code is required');
        setLoading(false);
        return;
      }
      payload.phone = session?.phone;
      payload.code = otp;
    }

    try {
      const res = await fetch('/api/auth/step-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.message ?? 'Verification failed');
      }

      toast('Security check completed successfully', 'success');
      resolveStepUp(true);
    } catch (err: any) {
      setError(err?.message ?? 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resolveStepUp(false);
  };

  return (
    <Modal
      open={stepUpOpen}
      onClose={handleClose}
      title="Security Verification"
      description="Re-authenticate to authorize this sensitive action"
      size="sm"
      dismissible={true}
    >
      <div className="space-y-4">
        {/* Toggle verification method */}
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              method === 'password'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => {
              setMethod('password');
              setError(null);
              setTimeout(() => passwordRef.current?.focus(), 50);
            }}
          >
            Password
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              method === 'otp'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => {
              setMethod('otp');
              setError(null);
              if (otpSent) {
                setTimeout(() => otpRef.current?.focus(), 50);
              }
            }}
          >
            SMS OTP
          </button>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</p>}

        <form onSubmit={handleVerify} className="space-y-4">
          {method === 'password' ? (
            <Input
              ref={passwordRef}
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          ) : (
            <div className="space-y-3">
              {otpSent ? (
                <Input
                  ref={otpRef}
                  label="OTP Verification Code"
                  type="text"
                  placeholder="Enter 6-digit OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  disabled={loading}
                  required
                />
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-slate-600 mb-3">
                    We will send a one-time verification code to{' '}
                    <span className="font-semibold text-slate-900">{session?.phone}</span>
                  </p>
                  <Button type="button" variant="ghost" onClick={handleSendOtp} loading={loading}>
                    Send Verification Code
                  </Button>
                </div>
              )}

              {otpSent && (
                <div className="flex items-center justify-between text-xs">
                  {countdown > 0 ? (
                    <span className="text-slate-500">Resend code in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      className="font-semibold text-brand-600 hover:underline"
                      onClick={handleSendOtp}
                      disabled={loading}
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {(method === 'password' || otpSent) && (
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" fullWidth onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" fullWidth loading={loading}>
                Verify
              </Button>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}
