import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  addCartItem,
  fetchMe,
  loginWithEmail,
  logoutSession,
  requestOtp,
  requestPasswordReset,
  resetPasswordWithCode,
  signupWithEmail,
  stepUp,
  verifyOtp,
} from '@/services/buyer-api';
import { clearTokens } from '@/lib/auth/session';
import { useAuthStore } from '@/store/auth-store';
import { cartKeys } from '@/hooks/use-cart';
import { useGuestCartStore } from '@/store/guest-cart-store';

export const AUTH_ME_KEY = ['auth', 'me'] as const;

/** Pushes the guest's locally-held cart lines into the newly-authenticated
 *  server cart, then clears the guest cart. Best-effort per line — one
 *  failure (e.g. an item went out of stock while browsing as a guest)
 *  doesn't block sign-in or the rest of the merge. */
async function mergeGuestCartIntoServer(qc: QueryClient): Promise<void> {
  const { items, clear } = useGuestCartStore.getState();
  if (items.length === 0) return;

  for (const item of items) {
    try {
      await addCartItem({ productId: item.productId, variantId: item.variantId, quantity: item.quantity });
    } catch {
      // Item may be out of stock or the store no longer serviceable — skip it.
    }
  }
  clear();
  await qc.invalidateQueries({ queryKey: cartKeys.current });
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.status === 'authenticated');
}

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: fetchMe,
    retry: false,
    staleTime: 60_000,
    enabled,
  });
}

export function useRequestOtpMutation() {
  return useMutation({ mutationFn: requestOtp });
}

export function useVerifyOtpMutation() {
  const { setSession } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => verifyOtp(phone, code),
    onSuccess: async (data) => {
      setSession(data.user);
      qc.setQueryData(AUTH_ME_KEY, data.user);
      await mergeGuestCartIntoServer(qc);
    },
  });
}

export function useSignupMutation() {
  const { setSession } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string; referralCode?: string }) =>
      signupWithEmail(input),
    onSuccess: async (data) => {
      setSession(data.user);
      qc.setQueryData(AUTH_ME_KEY, data.user);
      await mergeGuestCartIntoServer(qc);
    },
  });
}

export function useEmailLoginMutation() {
  const { setSession } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginWithEmail(email, password),
    onSuccess: async (data) => {
      setSession(data.user);
      qc.setQueryData(AUTH_ME_KEY, data.user);
      await mergeGuestCartIntoServer(qc);
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ code, newPassword }: { code: string; newPassword: string }) =>
      resetPasswordWithCode(code, newPassword),
  });
}

/** Step-up re-auth for sensitive actions (checkout) when the session's login
 *  is more than 15 minutes old. Does not change the signed-in user, just
 *  refreshes authTime on the access token. */
export function useStepUpMutation() {
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => stepUp(phone, code),
  });
}

export function useLogoutMutation() {
  const { clearSession } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await logoutSession();
      } finally {
        await clearTokens();
      }
    },
    onSettled: () => {
      clearSession();
      qc.clear();
    },
  });
}
