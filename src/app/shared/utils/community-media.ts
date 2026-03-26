import { environment } from '../../environments/environment';

const SITE_BASE_URL = String(environment.apiBaseUrl || '')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

export function resolveCommunityMediaUrl(
  url?: string | null,
  fallback: string = ''
): string {
  const rawUrl = String(url || '').trim();
  if (!rawUrl) return fallback;

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
    return rawUrl;
  }

  const cleanUrl = rawUrl
    .replace(/^@local:\/+/i, '')
    .replace(/^@local:/i, '')
    .replace(/^\/+|\/+$/g, '')
    .trim();

  if (!cleanUrl) return fallback;

  const lowerUrl = cleanUrl.toLowerCase();

  if (lowerUrl.startsWith('api/')) {
    return `${SITE_BASE_URL}/${cleanUrl}`;
  }

  if (cleanUrl.includes('/')) {
    return `${SITE_BASE_URL}/${cleanUrl}`;
  }

  // Bare filenames are not enough to build a valid public URL.
  // The backend needs to return either an absolute URL or a relative path with its public folder.
  return fallback;
}
