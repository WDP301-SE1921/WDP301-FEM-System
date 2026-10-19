import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentNotifications } from '@/features/parent-dashboard/components/parent-notifications';
import type { AppNotification } from '@/features/parent-dashboard/types';
import { AppError } from '@/types/api';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getNotifications: jest.fn(),
    getUnreadNotificationCount: jest.fn(),
    markNotificationRead: jest.fn(),
    markAllNotificationsRead: jest.fn(),
  },
}));

const api = jest.mocked(parentDashboardApi);

/** Lan render dau co the cham khi cache Jest con trong. */
const FIRST_RENDER_TIMEOUT_MS = 5000;
const PAGE_SIZE = 20;

function notification(id: string, overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id,
    type: 'ATTENDANCE_FINALIZED',
    title: `Thông báo ${id}`,
    body: `Nội dung ${id}`,
    target: { kind: 'SESSION', id: `session-${id}` },
    context: { classId: 'class-math', studentIds: ['student-1'] },
    createdAt: new Date().toISOString(),
    readAt: new Date().toISOString(),
    ...overrides,
  };
}

const UNREAD = notification('moi', {
  type: 'GRADE_PUBLISHED',
  title: 'Cập nhật học tập',
  body: 'Giáo viên đã công bố kết quả bài làm.',
  target: { kind: 'ASSIGNMENT', id: 'assignment-1' },
  context: { studentIds: ['student-2'] },
  readAt: null,
});

async function renderNotifications() {
  const onOpenNotification = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ParentNotifications onOpenNotification={onOpenNotification} />
    </QueryClientProvider>,
  );
  return { onOpenNotification, user: userEvent.setup() };
}

describe('features/parent-dashboard/ParentNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getStudents.mockResolvedValue([
      { id: 'student-1', fullName: 'Nguyễn Minh Anh', grade: 8, subjectNames: [] },
      { id: 'student-2', fullName: 'Nguyễn Hoàng Long', grade: 6, subjectNames: [] },
    ]);
    api.getUnreadNotificationCount.mockResolvedValue({ unreadCount: 1 });
    api.markNotificationRead.mockResolvedValue({ ...UNREAD, readAt: new Date().toISOString() });
  });

  it('hien hop thu kem ten con, bam thong bao chua doc thi danh dau da doc va mo bai', async () => {
    api.getNotifications.mockResolvedValue({
      items: [UNREAD, notification('cu')],
      page: 1,
      limit: PAGE_SIZE,
      total: 2,
    });
    const { onOpenNotification, user } = await renderNotifications();

    expect(
      await screen.findByText(UNREAD.body, {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.getByText('1 thông báo chưa đọc')).toBeOnTheScreen();
    expect(await screen.findByText('Hoàng Long')).toBeOnTheScreen();
    expect(screen.getByText('Minh Anh')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Xem thêm' })).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: /^Chưa đọc\. Cập nhật học tập/ }));
    expect(api.markNotificationRead).toHaveBeenCalledWith('moi');
    expect(onOpenNotification).toHaveBeenCalledWith({
      kind: 'ASSIGNMENT',
      studentId: 'student-2',
      assignmentId: 'assignment-1',
    });

    // Thong bao da doc thi khong goi BE danh dau lai
    await user.press(screen.getByRole('button', { name: /^Thông báo cu/ }));
    expect(api.markNotificationRead).toHaveBeenCalledTimes(1);
    expect(onOpenNotification).toHaveBeenLastCalledWith({
      kind: 'SESSION',
      studentId: 'student-1',
      sessionId: 'session-cu',
    });
  });

  it('tai them trang sau khi BE con thong bao', async () => {
    const firstPage = Array.from({ length: PAGE_SIZE }, (_, index) => notification(`p1-${index}`));
    api.getNotifications.mockImplementation(async ({ page }) =>
      page === 1
        ? { items: firstPage, page: 1, limit: PAGE_SIZE, total: PAGE_SIZE + 1 }
        : { items: [notification('p2-0')], page: 2, limit: PAGE_SIZE, total: PAGE_SIZE + 1 },
    );
    const { user } = await renderNotifications();

    await user.press(
      await screen.findByRole('button', { name: 'Xem thêm' }, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    );

    expect(await screen.findByText('Nội dung p2-0')).toBeOnTheScreen();
    expect(api.getNotifications).toHaveBeenLastCalledWith({ page: 2, limit: PAGE_SIZE });
    expect(screen.queryByRole('button', { name: 'Xem thêm' })).not.toBeOnTheScreen();
  });

  it('doc tat ca thi goi BE roi tai lai so chua doc', async () => {
    api.getNotifications.mockResolvedValue({
      items: [UNREAD],
      page: 1,
      limit: PAGE_SIZE,
      total: 1,
    });
    api.markAllNotificationsRead.mockResolvedValue({ updatedCount: 1, unreadCount: 0 });
    const { user } = await renderNotifications();

    const readAll = await screen.findByRole(
      'button',
      { name: /Đọc tất cả$/ },
      { timeout: FIRST_RENDER_TIMEOUT_MS },
    );
    api.getUnreadNotificationCount.mockResolvedValue({ unreadCount: 0 });
    await user.press(readAll);

    expect(api.markAllNotificationsRead).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Đã đọc hết thông báo')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Đọc tất cả$/ })).not.toBeOnTheScreen();
  });

  it('hop thu rong va loi tai', async () => {
    api.getUnreadNotificationCount.mockResolvedValue({ unreadCount: 0 });
    api.getNotifications
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce({ items: [], page: 1, limit: PAGE_SIZE, total: 0 });
    const { user } = await renderNotifications();

    await user.press(
      await screen.findByRole('button', { name: 'Thử lại' }, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    );

    expect(await screen.findByText('Chưa có thông báo')).toBeOnTheScreen();
  });
});
