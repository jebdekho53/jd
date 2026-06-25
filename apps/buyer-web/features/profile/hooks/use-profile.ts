import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProfile,
  getProfileStats,
  updateProfile,
  uploadAvatar,
  removeAvatar,
} from '@/features/profile/services/profile-service';
import type { UpdateProfileInput } from '@/features/profile/types';

export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
  stats: () => [...profileKeys.all, 'stats'] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: getProfile,
    staleTime: 60_000,
  });
}

export function useProfileStatsQuery() {
  return useQuery({
    queryKey: profileKeys.stats(),
    queryFn: getProfileStats,
    staleTime: 30_000,
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

export function useUploadAvatarMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadAvatar(file);
      return updateProfile({ avatarUrl: url });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

export function useRemoveAvatarMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await removeAvatar();
      return updateProfile({ avatarUrl: null });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}
