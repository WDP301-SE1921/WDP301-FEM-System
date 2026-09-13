/* eslint-disable no-console -- logger la lop bao boc console duy nhat cua app */
import { isDev } from '@/constants/config';

/**
 * Log tap trung. O production chi giu error de sau nay gan Sentry/Crashlytics.
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[debug]', ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.log('[info]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[warn]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[error]', ...args);
    // TODO: gui len dich vu crash reporting khi da tich hop
  },
};
