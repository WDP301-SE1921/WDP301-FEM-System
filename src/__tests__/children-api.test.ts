import { apiClient } from '@/api/client';
import { childrenApi } from '@/features/children/api/children-api';
import type { ChildProfile } from '@/features/children/types';

jest.mock('@/api/client', () => ({ apiClient: { get: jest.fn() } }));

const get = jest.mocked(apiClient.get);

function child(index: number): ChildProfile {
  return { id: `student-${index}`, fullName: `Con ${index}`, grade: 7, dateOfBirth: null };
}

/** Mot trang cua GET /me/students voi `paginated=true`, trong envelope cua BE. */
function pageResponse(items: ChildProfile[], total: number, page: number) {
  return { data: { success: true, data: { items, page, limit: 100, total } } };
}

describe('features/children/api/childrenApi.list', () => {
  afterEach(() => jest.clearAllMocks());

  it('BE chi tra mot trang (mac dinh 20 dong): xin trang 100 dong kem metadata', async () => {
    get.mockResolvedValueOnce(pageResponse([child(1)], 1, 1));

    await expect(childrenApi.list()).resolves.toEqual([child(1)]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/me/students', {
      params: { paginated: true, page: 1, limit: 100 },
    });
  });

  it('nhieu con hon mot trang thi doc tiep theo `total`', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => child(index));
    get
      .mockResolvedValueOnce(pageResponse(firstPage, 101, 1))
      .mockResolvedValueOnce(pageResponse([child(100)], 101, 2));

    await expect(childrenApi.list()).resolves.toHaveLength(101);
    expect(get).toHaveBeenLastCalledWith('/me/students', {
      params: { paginated: true, page: 2, limit: 100 },
    });
  });
});
