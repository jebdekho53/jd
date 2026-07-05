'use client';

import { useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import type { ProfileUser } from '@/features/profile/types';
import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const TIER_LABELS = {
  member: 'Member',
  gold: 'Gold Member',
  platinum: 'Platinum',
} as const;

interface ProfileHeaderProps {
  profile: ProfileUser;
  onUpload: (file: File) => void;
  onRemoveAvatar: () => void;
  onEdit: () => void;
  isUploading?: boolean;
  className?: string;
}

export function ProfileHeader({
  profile,
  onUpload,
  onRemoveAvatar,
  onEdit,
  isUploading,
  className,
}: ProfileHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-card',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative mx-auto sm:mx-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-white shadow-md transition hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed"
            aria-label="Upload profile photo"
          >
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/15 text-2xl font-bold text-primary">
                {getInitials(profile.displayName)}
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                Uploading…
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow"
            aria-label="Upload profile photo"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-xl font-bold text-jd-text-primary">{profile.displayName}</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {TIER_LABELS[profile.membershipTier]}
            </span>
          </div>
          <p className="mt-1 text-sm text-jd-text-muted">{profile.phone}</p>
          {profile.email && (
            <p className="text-sm text-jd-text-muted">{profile.email}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Edit profile
          </button>
          {profile.avatarUrl && (
            <button
              type="button"
              onClick={onRemoveAvatar}
              disabled={isUploading}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-destructive hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Remove photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
