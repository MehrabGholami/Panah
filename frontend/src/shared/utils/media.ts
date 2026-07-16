export function resolveMediaUrl(url: string | null | undefined, cacheKey?: string | number): string | undefined {
  if (!url) return undefined;
  let resolved = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    resolved = url.startsWith('/') ? url : `/${url}`;
  }
  if (cacheKey === undefined || cacheKey === null || cacheKey === '') return resolved;
  const separator = resolved.includes('?') ? '&' : '?';
  return `${resolved}${separator}v=${encodeURIComponent(String(cacheKey))}`;
}
