import { merchantFetch } from '@/services/api/merchant-client';
import type { ImageCropMode } from '@jebdekho/image-utils';

export type UploadPurpose = 'product' | 'store-logo' | 'store-banner' | 'category';

const PURPOSE_MAP: Record<ImageCropMode | 'square', UploadPurpose> = {
  square: 'product',
  banner: 'store-banner',
};

export function cropModeToPurpose(mode: ImageCropMode, explicit?: UploadPurpose): UploadPurpose {
  if (explicit) return explicit;
  return PURPOSE_MAP[mode] ?? 'product';
}

export async function uploadImage(dataUrl: string, purpose: UploadPurpose): Promise<string> {
  const res = await merchantFetch<{ success: boolean; data: { url: string } }>(
    '/api/uploads/image',
    {
      method: 'POST',
      body: JSON.stringify({ dataUrl, purpose }),
    },
  );
  return res.data.url;
}
