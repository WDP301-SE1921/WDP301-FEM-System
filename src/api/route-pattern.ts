const PATH_SEPARATOR = '/';
const PATH_PARAM_PREFIX = ':';

/** Method viet thuong nhu `config.method` axios dua toi adapter. */
export type RouteMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Mot endpoint cua app. `url` lay tu `Endpoints` va so khop voi `config.url` (duong dan tuong doi);
 * doan bat dau bang `:` khop mot doan bat ky, vd `Endpoints.me.student(':studentId')`.
 */
export type RoutePattern = {
  method: RouteMethod;
  url: string;
};

/** So khop `url` voi mau cua route. Tra ve tham so duong dan, hoac null neu khong khop. */
export function matchPath(pattern: string, url: string): Record<string, string> | null {
  const patternSegments = pattern.split(PATH_SEPARATOR);
  const urlSegments = url.split(PATH_SEPARATOR);
  if (patternSegments.length !== urlSegments.length) return null;

  const params: Record<string, string> = {};
  const isMatch = patternSegments.every((segment, index) => {
    const value = urlSegments[index] ?? '';
    if (!segment.startsWith(PATH_PARAM_PREFIX)) return segment === value;
    params[segment.slice(PATH_PARAM_PREFIX.length)] = decodeURIComponent(value);
    return value.length > 0;
  });
  return isMatch ? params : null;
}
