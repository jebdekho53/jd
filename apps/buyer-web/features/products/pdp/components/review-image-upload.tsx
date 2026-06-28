'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { processImageFile } from '@jebdekho/image-utils';

const MAX_IMAGES = 5;
const MAX_BYTES = 2 * 1024 * 1024;

interface ReviewImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ReviewImageUpload({ images, onChange }: ReviewImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const batch = Array.from(files).slice(0, remaining);
    for (const file of batch) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPEG, PNG, or WebP images are allowed');
        return;
      }
      if (file.size > MAX_BYTES) {
        setError('Each image must be 2MB or smaller');
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of batch) {
        const dataUrl = await processImageFile(file, 'square');
        const res = await fetch('/api/buyer/uploads/image', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, purpose: 'review' }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? 'Upload failed');
        uploaded.push(json.data.url as string);
      }
      onChange([...images, ...uploaded].slice(0, MAX_IMAGES));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
            <Image src={url} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
              onClick={() => onChange(images.filter((i) => i !== url))}
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-border text-xs text-jd-text-muted"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Add
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-[11px] text-jd-text-muted">Up to {MAX_IMAGES} photos · JPEG/PNG/WebP · max 2MB each</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
