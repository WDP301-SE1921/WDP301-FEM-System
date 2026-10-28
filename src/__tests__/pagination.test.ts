import { MAX_PAGE_LIMIT, readAllPages } from '@/api/pagination';
import { logger } from '@/lib/logger';
import type { PageQuery } from '@/types/api';

jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

/** BE gia co `total` ban ghi, tra tung trang theo `page`, `limit`. */
function fakeList(total: number) {
  const rows = Array.from({ length: total }, (_, index) => index);
  const queries: PageQuery[] = [];
  const readPage = (query: PageQuery) => {
    queries.push(query);
    const start = (query.page - 1) * query.limit;
    return Promise.resolve({ items: rows.slice(start, start + query.limit), total });
  };
  return { queries, readPage };
}

describe('api/pagination', () => {
  afterEach(() => jest.clearAllMocks());

  it('doc tung trang 100 dong cho toi khi du `total`', async () => {
    const list = fakeList(250);

    await expect(readAllPages(list.readPage)).resolves.toHaveLength(250);
    expect(list.queries).toEqual([
      { page: 1, limit: MAX_PAGE_LIMIT },
      { page: 2, limit: MAX_PAGE_LIMIT },
      { page: 3, limit: MAX_PAGE_LIMIT },
    ]);
  });

  it('danh sach nho hoac rong chi goi mot trang', async () => {
    const small = fakeList(1);
    await expect(readAllPages(small.readPage)).resolves.toEqual([0]);
    expect(small.queries).toHaveLength(1);

    const empty = fakeList(0);
    await expect(readAllPages(empty.readPage)).resolves.toEqual([]);
    expect(empty.queries).toHaveLength(1);
  });

  it('BE tra trang rong truoc khi du `total` thi dung, khong lap', async () => {
    const readPage = jest.fn((query: PageQuery) =>
      Promise.resolve({ items: query.page === 1 ? [1, 2] : [], total: 10 }),
    );

    await expect(readAllPages(readPage)).resolves.toEqual([1, 2]);
    expect(readPage).toHaveBeenCalledTimes(2);
  });

  it('`total` sai khien doc mai thi dung o 20 trang va ghi log', async () => {
    const readPage = jest.fn(() => Promise.resolve({ items: [1], total: Number.MAX_SAFE_INTEGER }));

    await expect(readAllPages(readPage)).resolves.toHaveLength(20);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
