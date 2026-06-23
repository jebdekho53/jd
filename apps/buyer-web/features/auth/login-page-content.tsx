'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, CardBody, Container, Text } from '@/design-system/primitives';
import { OtpInput } from '@/features/auth/components/otp-input';
import { PhoneInput } from '@/features/auth/components/phone-input';
import { applyAuthSession } from '@/features/auth/auth-provider';
import { useRequestOtpMutation, useVerifyOtpMutation, SessionError } from '@/hooks/use-auth';
import { isValidIndianPhone, normalizeIndianPhone } from '@/lib/phone';
import { useToast } from '@/design-system/primitives';

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a 10-digit mobile number')
    .refine(isValidIndianPhone, 'Enter a valid Indian mobile number'),
});

type PhoneForm = z.infer<typeof phoneSchema>;

type Step = 'phone' | 'otp';

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const returnUrl = searchParams.get('returnUrl') ?? '/stores';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  const requestOtp = useRequestOtpMutation();
  const verifyOtp = useVerifyOtpMutation();

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  const sendOtp = async (phoneDigits: string) => {
    const e164 = normalizeIndianPhone(phoneDigits);
    setPhone(e164);
    try {
      const result = await requestOtp.mutateAsync(e164);
      setStep('otp');
      setOtp('');
      setOtpError(null);
      setResendSeconds(result.expiresIn ?? 300);
      toast('OTP sent to your phone', 'success');
    } catch (err) {
      const msg =
        err instanceof SessionError
          ? err.status === 429
            ? 'Too many OTP requests. Please wait and try again.'
            : err.message
          : 'Failed to send OTP';
      toast(msg, 'error');
    }
  };

  const onPhoneSubmit = phoneForm.handleSubmit(async ({ phone: digits }) => {
    await sendOtp(digits);
  });

  const onVerifyOtp = async () => {
    if (otp.length < 4) {
      setOtpError('Enter the complete OTP');
      return;
    }
    setOtpError(null);
    try {
      const result = await verifyOtp.mutateAsync({ phone, code: otp });
      applyAuthSession(result.user, result.isNewUser);
      toast('Logged in successfully', 'success');
      if (result.isNewUser) {
        router.replace('/onboarding');
      } else {
        router.replace(returnUrl);
      }
    } catch (err) {
      const msg =
        err instanceof SessionError
          ? err.message.includes('expired') || err.message.includes('Invalid')
            ? 'Invalid or expired OTP. Request a new one.'
            : err.message
          : 'Verification failed';
      setOtpError(msg);
      toast(msg, 'error');
    }
  };

  return (
    <div className="s2-root min-h-screen bg-neutral-50">
      <Container size="sm" className="py-12">
        <div className="mb-8 text-center">
          <Text variant="display" as="h1">
            Jebdekho
          </Text>
          <Text variant="bodySm" className="mt-2">
            Sign in with your mobile number
          </Text>
        </div>

        <Card>
          <CardBody className="space-y-6">
            {step === 'phone' && (
              <form onSubmit={onPhoneSubmit} className="space-y-6">
                <PhoneInput
                  value={phoneForm.watch('phone')}
                  onChange={(v) => phoneForm.setValue('phone', v, { shouldValidate: true })}
                  error={phoneForm.formState.errors.phone?.message}
                  disabled={requestOtp.isPending}
                />
                <Button type="submit" fullWidth loading={requestOtp.isPending}>
                  Send OTP
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Text variant="bodySm">
                    OTP sent to <span className="font-medium text-neutral-900">{phone}</span>
                  </Text>
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                    }}
                  >
                    Change number
                  </button>
                </div>

                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={verifyOtp.isPending}
                  error={otpError ?? undefined}
                />

                <Button fullWidth loading={verifyOtp.isPending} onClick={onVerifyOtp}>
                  Verify &amp; continue
                </Button>

                <div className="text-center">
                  {resendSeconds > 0 ? (
                    <Text variant="caption">Resend OTP in {resendSeconds}s</Text>
                  ) : (
                    <button
                      type="button"
                      className="text-sm font-medium text-emerald-700 hover:underline"
                      onClick={() => sendOtp(phone.replace(/^\+91/, ''))}
                      disabled={requestOtp.isPending}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
