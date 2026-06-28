'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Text } from '@/design-system/primitives';
import { isPlaceholderPhone } from '@/lib/phone';
import type { PayerContact } from '@/types/checkout';

const schema = z.object({
  name: z.string().min(2, 'Enter your full name').max(100),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});

type FormData = z.infer<typeof schema>;

interface PayerContactFormProps {
  value: PayerContact | null;
  onChange: (contact: PayerContact) => void;
  defaultName?: string;
  defaultEmail?: string | null;
  defaultPhone?: string | null;
}

export function PayerContactForm({
  value,
  onChange,
  defaultName,
  defaultEmail,
  defaultPhone,
}: PayerContactFormProps) {
  const {
    register,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: value?.name ?? defaultName ?? '',
      email: value?.email ?? defaultEmail ?? '',
      phone:
        value?.phone ??
        (defaultPhone && !isPlaceholderPhone(defaultPhone)
          ? defaultPhone.replace(/\D/g, '').slice(-10)
          : ''),
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (value) return;
    reset({
      name: defaultName ?? '',
      email: defaultEmail ?? '',
      phone:
        defaultPhone && !isPlaceholderPhone(defaultPhone)
          ? defaultPhone.replace(/\D/g, '').slice(-10)
          : '',
    });
  }, [defaultName, defaultEmail, defaultPhone, reset, value]);

  useEffect(() => {
    const sub = watch((data) => {
      const parsed = schema.safeParse(data);
      if (parsed.success) onChange(parsed.data);
    });
    return () => sub.unsubscribe();
  }, [watch, onChange]);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <div>
        <Text variant="label" className="block">
          Payment contact details
        </Text>
        <Text variant="caption" className="mt-0.5 block text-muted-foreground">
          Required by Razorpay for receipts and payment confirmation
        </Text>
      </div>
      <Input
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Mobile number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="10-digit mobile"
        maxLength={10}
        error={errors.phone?.message}
        {...register('phone')}
      />
    </div>
  );
}
