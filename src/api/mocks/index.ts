import type { AxiosInstance } from 'axios';

import { logger } from '@/lib/logger';

import { academicRoutes } from './academic';
import { authRoutes } from './auth';
import { createMockAdapter } from './mock-adapter';
import { parentRoutes } from './parent';
import { registrationFlowRoutes } from './registration-flow';

/**
 * App chi dung mock: moi endpoint mobile goi phai co route o day, ke ca endpoint BE da lam xong.
 * Chi xoa route khi nguoi dung yeu cau noi BE that (wire).
 */
const MOCK_ROUTES = [...authRoutes, ...parentRoutes, ...registrationFlowRoutes, ...academicRoutes];

/** Thay adapter mang cua cac axios instance bang server gia: khong request nao ra mang. */
export function installMockApi(...instances: AxiosInstance[]) {
  instances.forEach((instance) => {
    instance.defaults.adapter = createMockAdapter(MOCK_ROUTES);
  });
  logger.info(`[mock] Dang gia lap ${MOCK_ROUTES.length} endpoint`);
}
