import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';

import { logger } from '@/lib/logger';
import type { ApiErrorBody, ApiResponse } from '@/types/api';

/** Do tre gia lap de UI hien du trang thai loading nhu khi goi mang that. */
const MOCK_LATENCY_MS = 600;
const HTTP_OK = 200;
const HTTP_REDIRECT = 300;
const HTTP_BAD_REQUEST = 400;
const HTTP_SERVER_ERROR = 500;
const BEARER_PREFIX = 'Bearer ';
const PATH_SEPARATOR = '/';
const PATH_PARAM_PREFIX = ':';

/** Response gia, bat buoc dung envelope thanh cong hoac loi cua BE. */
export type MockReply = { status: number; body: ApiResponse<unknown> | ApiErrorBody };

/** Phan cua request ngoai body ma route mock can, vd token de gia lap JwtAuthGuard. */
export type MockRequest = {
  accessToken: string | null;
  /** Gia tri cac doan `:ten` trong `MockRoute.url`, vd `{ studentId: 'abc' }`. */
  params: Readonly<Record<string, string>>;
  /** Query string, lay tu `params` cua axios, vd `{ from: '2026-10-12' }`. */
  query: Readonly<Record<string, string>>;
};

export type MockRoute = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  /**
   * Lay tu `Endpoints`, so khop voi `config.url` (chua gom baseURL). Doan bat dau bang `:` khop
   * mot doan bat ky, vd `Endpoints.users.detail(':id')`.
   */
  url: string;
  handle: (body: unknown, request: MockRequest) => MockReply;
};

export function mockOk(data: unknown, status = HTTP_OK): MockReply {
  return { status, body: { success: true, data } };
}

export function mockError(status: number, code: string, message: string): MockReply {
  return {
    status,
    body: { success: false, error: { code, message, requestId: `mock-${Date.now()}` } },
  };
}

/** Giong AllExceptionsFilter cua BE: moi loi 400 deu ra code VALIDATION_ERROR. */
export function mockValidationError(): MockReply {
  return mockError(HTTP_BAD_REQUEST, 'VALIDATION_ERROR', 'Request validation failed');
}

/**
 * Gia lap ValidationPipe({ whitelist, forbidNonWhitelisted }) cua BE:
 * body thua field hoac thieu field bat buoc thi tra null (-> 400).
 */
export function readBody(
  body: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Record<string, unknown> | null {
  if (typeof body !== 'object' || body === null) return null;

  const record: Record<string, unknown> = Object.fromEntries(Object.entries(body));
  const allowed = new Set([...required, ...optional]);
  const hasUnknownKey = Object.keys(record).some((key) => !allowed.has(key));
  const hasMissingKey = required.some((key) => record[key] === undefined);
  return hasUnknownKey || hasMissingKey ? null : record;
}

/** transformRequest cua axios da stringify body truoc khi toi adapter. */
function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

/** Axios chi ghep `params` vao URL trong adapter mang, nen mock doc thang `params` va doi sang chuoi. */
function readQuery(params: unknown): Record<string, string> {
  if (typeof params !== 'object' || params === null) return {};
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );
}

function readBearerToken(header: unknown): string | null {
  if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX)) return null;
  return header.slice(BEARER_PREFIX.length);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** So khop `url` voi mau cua route. Tra ve tham so duong dan, hoac null neu khong khop. */
function matchPath(pattern: string, url: string): Record<string, string> | null {
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

type MatchedRoute = { route: MockRoute; params: Record<string, string> };

function findRoute(
  routes: readonly MockRoute[],
  method: string | undefined,
  url: string | undefined,
): MatchedRoute | null {
  if (!url) return null;
  for (const route of routes) {
    const params = route.method === method ? matchPath(route.url, url) : null;
    if (params) return { route, params };
  }
  return null;
}

/**
 * Adapter axios dong vai server gia: request trung route mock thi tra response theo envelope BE,
 * request khac chuyen cho adapter mang that. Interceptor, unwrap `data.data` va normalizeError
 * van chay nhu voi BE that, nen doi sang API that khong phai sua code feature.
 */
export function createMockAdapter(
  routes: readonly MockRoute[],
  networkAdapter: AxiosAdapter,
  latencyMs: number = MOCK_LATENCY_MS,
): AxiosAdapter {
  return async (config) => {
    const matched = findRoute(routes, config.method, config.url);
    if (!matched) return networkAdapter(config);

    await wait(latencyMs);
    const request: MockRequest = {
      accessToken: readBearerToken(config.headers.Authorization),
      params: matched.params,
      query: readQuery(config.params),
    };
    const { status, body } = matched.route.handle(parseBody(config.data), request);
    logger.debug(`[mock] ${config.method?.toUpperCase()} ${config.url} -> ${status}`);

    const response: AxiosResponse = {
      data: body,
      status,
      statusText: '',
      headers: new AxiosHeaders(),
      config,
    };
    const isSuccess =
      config.validateStatus?.(status) ?? (status >= HTTP_OK && status < HTTP_REDIRECT);
    if (isSuccess) return response;

    throw new AxiosError(
      `Mock request failed with status ${status}`,
      status >= HTTP_SERVER_ERROR ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response,
    );
  };
}
