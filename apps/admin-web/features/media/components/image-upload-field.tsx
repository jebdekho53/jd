'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2 } from 'lucide-react';
import { processImageFile, type ImageCropMode } from '@jebdekho/image-utils';
import { uploadImage, type UploadPurpose } from '@/services/uploads/upload-api';
import { Button } from '@/design-system';

interface ImageUploadFieldProps {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  mode?: ImageCropMode;
  purpose?: UploadPurpose;
  required?: boolean;
  error?: string;
  allowRemove?: boolean;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  mode = 'square',
  purpose = 'category',
  required,
  error,
  allowRemove = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLocalError(null);
    setUploading(true);
    try {
      const dataUrl = await processImageFile(file, mode);
      const url = await uploadImage(dataUrl, purpose);
      onChange(url);
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const previewClass =
    mode === 'banner'
      ? 'relative h-24 w-full overflow-hidden rounded-xl border border-slate-200'
      : 'relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required ? ' *' : ''}
      </label>
      <div className="flex flex-wrap items-start gap-3">
        {value ? (
          <div className={previewClass}>
            <Image src={value} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div
            className={`${previewClass} flex items-center justify-center bg-slate-50 text-slate-400`}
          >
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Upload 1:1 image'}
          </Button>
          {value && allowRemove && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {(error || localError) && <p className="text-sm text-red-600">{error ?? localError}</p>}
      <p className="text-xs text-slate-500">Square 1:1 image required for categories.</p>
    </div>
  );
}
