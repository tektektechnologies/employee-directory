import type { ServerClient } from "@/lib/supabase/server";

export const PHOTO_BUCKET = "avatars";
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

// Must match allowed_mime_types on the bucket.
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
const SIGNED_URL_SECONDS = 60 * 60;

export function checkPhoto(file: File) {
  if (!PHOTO_TYPES[file.type]) return "Choose a JPG, PNG, or WebP image.";
  if (file.size > MAX_PHOTO_BYTES) return "Choose an image under 2 MB.";
  return null;
}

export function newPhotoPath(userId: string, file: File) {
  return `${userId}/${crypto.randomUUID()}.${PHOTO_TYPES[file.type]}`;
}

export function isOwnPhotoPath(path: string, userId: string) {
  return PATH_PATTERN.test(path) && path.startsWith(`${userId}/`);
}

// One request for a whole page of cards. Returns a map from path to URL; a
// photo that can't be signed is simply missing from the map.
export async function getPhotoUrls(supabase: ServerClient, paths: string[]) {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

export async function getPhotoUrl(supabase: ServerClient, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  return data?.signedUrl ?? null;
}
