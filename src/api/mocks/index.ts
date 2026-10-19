import { createMockAdapter, type MockRoute } from './mock-adapter';

/**
 * Server gia cho cac endpoint chua noi BE that. Endpoint da wire nam trong `@/api/wired-routes` va
 * khong co route o day; chi xoa route khi nguoi dung yeu cau wire endpoint do. Tu ngay 2026-10-19 moi
 * endpoint app goi deu da wire nen chua co route nao, nhung adapter van chan moi request chua wire
 * (404, khong ra mang). Them endpoint moi chua wire thi them route mock o day.
 */
export const MOCK_ROUTES: readonly MockRoute[] = [];

/** Adapter tra loi moi request chua wire bang server gia, khong ra mang. */
export const mockAdapter = createMockAdapter(MOCK_ROUTES);
