import { logger } from '@/lib/logger';
import type { Page, PageQuery } from '@/types/api';

/** `limit` lon nhat BE nhan (PageDto). */
export const MAX_PAGE_LIMIT = 100;
/** Chan vong lap khi BE tra `total` sai: 20 trang la 2000 ban ghi. */
const MAX_PAGES = 20;

/** Mot trang cua route phan trang, rut gon ve danh sach va tong so ban ghi. */
export type PageSlice<T> = Pick<Page<T>, 'items' | 'total'>;

/**
 * Doc het cac trang cua mot danh sach theo `total` cua BE, moi trang `MAX_PAGE_LIMIT` dong. Tu BE
 * `e2cb844` moi danh sach chi tra mot trang (mac dinh 20 dong), nen khong doc het thi app thieu du
 * lieu ma khong bao loi.
 */
export async function readAllPages<T>(
  readPage: (query: PageQuery) => Promise<PageSlice<T>>,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await readPage({ page, limit: MAX_PAGE_LIMIT });
    items.push(...batch.items);
    if (batch.items.length === 0 || items.length >= batch.total) return items;
  }
  logger.warn('[api] Danh sach vuot qua so trang toi da, bo phan con lai', {
    maxPages: MAX_PAGES,
  });
  return items;
}
