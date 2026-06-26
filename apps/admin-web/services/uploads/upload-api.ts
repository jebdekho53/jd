import { adminFetch } from '@/services/api/admin-client';
import type { ImageCropMode } from '@jebdekho/image-utils';

export type UploadPurpose = 'product' | 'store-logo' | 'store-banner' | 'category';

export async function uploadImage(dataUrl: string, purpose: UploadPurpose): Promise<string> {
  const res = await adminFetch<{ success: boolean; data: { url: string } }>(
    '/api/admin/uploads/image',
    {
      method: 'POST',
      body: JSON.stringify({ dataUrl, purpose }),
    },
  );
  return res.data.url;
}

export type { ImageCropMode };
