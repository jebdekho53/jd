import { readFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { type AssetUrlConfig, uploadPublicBases } from './asset-url.util';

const ABSOLUTE_URL_RE = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Read the bytes of one of our own uploads back from disk, given its public URL
 * (or a relative `/uploads/...` path). Returns null for anything that isn't a
 * local upload or can't be read — callers treat that as "no image". Guards
 * against path traversal so a crafted URL can't escape the uploads dir.
 */
export async function readUploadFileFromUrl(
  uploadDir: string,
  config: AssetUrlConfig,
  url: string | null | undefined,
): Promise<Buffer | null> {
  const raw = url?.trim();
  if (!raw) return null;

  let rel: string | null = null;
  if (ABSOLUTE_URL_RE.test(raw)) {
    for (const base of uploadPublicBases(config)) {
      if (raw.startsWith(`${base}/`)) {
        rel = raw.slice(base.length + 1);
        break;
      }
    }
    if (rel === null) return null; // foreign URL — not ours to read
  } else {
    rel = raw.replace(/^\/+/, '');
  }

  // Drop a leading `uploads/` (present in the base path), query and fragment.
  rel = rel.replace(/^uploads\//i, '').split(/[?#]/)[0];
  if (!rel) return null;

  const full = normalize(join(uploadDir, rel));
  if (!full.startsWith(normalize(uploadDir))) return null; // traversal guard

  try {
    return await readFile(full);
  } catch {
    return null;
  }
}
