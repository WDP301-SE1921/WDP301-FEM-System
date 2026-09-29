import axios, { type AxiosInstance } from 'axios';

import { logger } from '@/lib/logger';

import { authRoutes } from './auth';
import { linkInvitationRoutes } from './link-invitations';
import { createMockAdapter } from './mock-adapter';
import { parentRoutes } from './parent';

/**
 * Moi endpoint mobile goi deu co route o day, ke ca endpoint BE da lam xong.
 * Chi xoa route khi nguoi dung yeu cau noi BE that (wire).
 */
const MOCK_ROUTES = [...authRoutes, ...linkInvitationRoutes, ...parentRoutes];

/** Gan server gia vao cac axios instance. Request khong khop route mock van di qua mang nhu thuong. */
export function installMockApi(...instances: AxiosInstance[]) {
  instances.forEach((instance) => {
    const networkAdapter = axios.getAdapter(instance.defaults.adapter);
    instance.defaults.adapter = createMockAdapter(MOCK_ROUTES, networkAdapter);
  });
  logger.info(`[mock] Dang gia lap ${MOCK_ROUTES.length} endpoint`);
}
