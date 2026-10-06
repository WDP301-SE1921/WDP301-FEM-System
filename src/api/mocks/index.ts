import { createMockAdapter, type MockRoute } from './mock-adapter';
import { parentRoutes } from './parent';

/**
 * Server gia cho cac endpoint chua noi BE that. Endpoint da wire nam trong `@/api/wired-routes` va
 * khong co route o day; chi xoa route khi nguoi dung yeu cau wire endpoint do.
 */
export const MOCK_ROUTES: readonly MockRoute[] = parentRoutes;

/** Adapter tra loi moi request chua wire bang server gia, khong ra mang. */
export const mockAdapter = createMockAdapter(MOCK_ROUTES);
