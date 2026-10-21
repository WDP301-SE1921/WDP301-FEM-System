import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';

import { matchPath, type RoutePattern } from '@/api/route-pattern';
import { logger } from '@/lib/logger';
import type { ApiErrorBody, ApiResponse } from '@/types/api';

/** Do tre gia lap de UI hien du trang thai loading nhu khi goi mang that. */
const MOCK_LATENCY_MS = 600;
const HTTP_OK = 200;
const HTTP_REDIRECT = 300;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;
const BEARER_PREFIX = 'Bearer ';

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

export type MockRoute = RoutePattern & {
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

/** Giong Nest khi khong co route: NotFoundException qua AllExceptionsFilter thanh 404 HTTP_ERROR. */
function noMockRoute(method: string, url: string | undefined): MockReply {
  logger.warn(
    `[mock] ${method} ${url} chua wire va chua co route mock, request bi chan (khong ra mang)`,
  );
  return mockError(HTTP_NOT_FOUND, 'HTTP_ERROR', `Cannot ${method} ${url}`);
}

/**
 * Adapter axios dong vai server gia cho moi endpoint chua wire (`@/api/wired-routes`): khong request
 * nao qua day ra mang. Request trung route mock thi tra response theo envelope BE, request khac nhan
 * 404. Interceptor, unwrap `data.data` va normalizeError van chay nhu voi BE that, nen luc duoc yeu
 * cau wire khong phai sua code feature.
 */
export function createMockAdapter(
  routes: readonly MockRoute[],
  latencyMs: number = MOCK_LATENCY_MS,
): AxiosAdapter {
  return async (config) => {
    const method = config.method?.toUpperCase() ?? '';
    const matched = findRoute(routes, config.method, config.url);

    await wait(latencyMs);
    const { status, body } = matched
      ? matched.route.handle(parseBody(config.data), {
          accessToken: readBearerToken(config.headers.Authorization),
          params: matched.params,
          query: readQuery(config.params),
        })
      : noMockRoute(method, config.url);
    logger.debug(`[mock] ${method} ${config.url} -> ${status}`);

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
