import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { parentDashboardApi } from '@/features/parent-dashboard/api/parent-dashboard-api';
import { ParentSessionDetail } from '@/features/parent-dashboard/components/parent-session-detail';
import type { LinkedStudent, SessionDetail } from '@/features/parent-dashboard/types';
import { AppError } from '@/types/api';

jest.mock('@/features/parent-dashboard/api/parent-dashboard-api', () => ({
  parentDashboardApi: {
    getStudents: jest.fn(),
    getSessionDetail: jest.fn(),
  },
}));

const api = jest.mocked(parentDashboardApi);

/** Lan render day du dau tien phai transform nhieu module, xem `parent-dashboard.test.tsx`. */
const FIRST_RENDER_TIMEOUT_MS = 5000;
const HOUR_MS = 60 * 60 * 1000;

const MINH_ANH: LinkedStudent = {
  id: 'student-1',
  fullName: 'Nguyễn Minh Anh',
  grade: 8,
  subjectNames: ['Toán', 'Vật lý'],
};
function at(hours: number, minutes = 0): string {
  return new Date(2026, 9, 16, hours, minutes).toISOString();
}

const SESSION_REF = { studentId: MINH_ANH.id, sessionId: 'session-1', startsAt: at(18) };

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * HOUR_MS).toISOString();
}

const COMPLETED_MAKEUP: SessionDetail = {
  id: SESSION_REF.sessionId,
  className: 'Toán nâng cao 8A2',
  subjectName: 'Toán',
  startsAt: at(18),
  endsAt: at(19, 30),
  room: 'P.203',
  teacherName: 'Đặng Hải Yến',
  type: 'MAKEUP',
  topic: 'Đại số',
  note: 'Bù cho buổi nghỉ ngày 05/10',
  status: 'COMPLETED',
  lesson: { sequence: 12, title: 'Phương trình bậc hai', description: 'Phương pháp đặt ẩn phụ' },
  attendance: 'PRESENT',
  checkedInAt: at(17, 55),
  teacherComment: 'Minh Anh tiếp thu bài tốt.',
  materials: [{ id: 'material-1', name: 'Phiếu bài tập số 12', note: 'Đã phát trên lớp' }],
};

const UPCOMING_REGULAR: SessionDetail = {
  ...COMPLETED_MAKEUP,
  startsAt: hoursFromNow(2),
  endsAt: hoursFromNow(3),
  type: 'REGULAR',
  topic: null,
  note: null,
  status: 'SCHEDULED',
  lesson: null,
  attendance: 'UNMARKED',
  checkedInAt: null,
  teacherComment: null,
  materials: [],
};

/** Buoi dung nhu app ghep tu BE: chua co phong, ten giao vien, diem danh, nhan xet va tai lieu. */
const BACKEND_SESSION: SessionDetail = {
  ...UPCOMING_REGULAR,
  room: null,
  teacherName: null,
  topic: 'Hằng đẳng thức đáng nhớ',
  lesson: { sequence: null, title: 'Hằng đẳng thức đáng nhớ', description: null },
  attendance: null,
};

async function renderDetail() {
  const onBack = jest.fn();
  // gcTime vo han de React Query khong hen gio don cache sau khi test ket thuc
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={queryClient}>
      <ParentSessionDetail {...SESSION_REF} onBack={onBack} />
    </QueryClientProvider>,
  );
  return { onBack, user: userEvent.setup() };
}

describe('features/parent-dashboard/ParentSessionDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getStudents.mockResolvedValue([MINH_ANH]);
  });

  it('buoi da chot diem danh: hien diem danh, ghi chu hoc bu, nhan xet va tai lieu', async () => {
    api.getSessionDetail.mockResolvedValue(COMPLETED_MAKEUP);
    await renderDetail();

    expect(
      await screen.findByText('Phương trình bậc hai', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(api.getSessionDetail).toHaveBeenCalledWith(SESSION_REF);
    expect(await screen.findByText('Học sinh: Nguyễn Minh Anh · Khối 8')).toBeOnTheScreen();
    expect(screen.getByText('Có mặt')).toBeOnTheScreen();

    expect(screen.getByText('Thông báo buổi học bù')).toBeOnTheScreen();
    expect(screen.getByText('Bù cho buổi nghỉ ngày 05/10')).toBeOnTheScreen();

    expect(screen.getByText('18:00 – 19:30')).toBeOnTheScreen();
    expect(screen.getByText('Tối · 90 phút')).toBeOnTheScreen();
    expect(screen.getByText('Phòng P.203')).toBeOnTheScreen();
    expect(screen.getByText('Bài 12: Phương trình bậc hai')).toBeOnTheScreen();
    expect(screen.getByText('Có mặt · Đúng giờ')).toBeOnTheScreen();
    expect(screen.getByText('Vào lớp lúc 17:55')).toBeOnTheScreen();

    expect(screen.getByText('“Minh Anh tiếp thu bài tốt.”')).toBeOnTheScreen();
    expect(screen.getByText('Phiếu bài tập số 12')).toBeOnTheScreen();
    expect(screen.getByText('Điểm danh đã được giáo viên xác nhận')).toBeOnTheScreen();
  });

  it('buoi sap toi: chua diem danh, chua co nhan xet; bam quay lai', async () => {
    api.getSessionDetail.mockResolvedValue(UPCOMING_REGULAR);
    const { onBack, user } = await renderDetail();

    expect(
      await screen.findByText('Buổi học Toán', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Sắp diễn ra')).toBeOnTheScreen();
    expect(screen.getByText('Chưa điểm danh')).toBeOnTheScreen();
    expect(screen.queryByText('Nhận xét & tài liệu')).not.toBeOnTheScreen();
    expect(screen.queryByText('Nội dung bài học')).not.toBeOnTheScreen();
    expect(screen.queryByText(/^Thông báo/)).not.toBeOnTheScreen();
    expect(screen.queryByText('Điểm danh đã được giáo viên xác nhận')).not.toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Quay lại' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('buoi tu BE: chi hien thong tin BE co, an phong, giao vien, diem danh va nhan xet', async () => {
    api.getSessionDetail.mockResolvedValue(BACKEND_SESSION);
    await renderDetail();

    expect(
      await screen.findByText('Nội dung bài học', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.getAllByText('Hằng đẳng thức đáng nhớ')).toHaveLength(2);
    expect(screen.getByText('Sắp diễn ra')).toBeOnTheScreen();
    expect(screen.getByText('Thời gian học')).toBeOnTheScreen();

    expect(screen.queryByText('Phòng học')).not.toBeOnTheScreen();
    expect(screen.queryByText('Giáo viên phụ trách')).not.toBeOnTheScreen();
    expect(screen.queryByText('Trạng thái điểm danh')).not.toBeOnTheScreen();
    expect(screen.queryByText('Chưa điểm danh')).not.toBeOnTheScreen();
    expect(screen.queryByText('Nhận xét & tài liệu')).not.toBeOnTheScreen();
  });

  it('khong thay buoi trong lich cua ngay do thi bao khong tim thay', async () => {
    api.getSessionDetail.mockResolvedValue(null);
    const { onBack, user } = await renderDetail();

    expect(
      await screen.findByText('Không tìm thấy buổi học', {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Quay lại' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('loi tai chi tiet thi hien thu lai, bam thu lai tai lai buoi hoc', async () => {
    api.getSessionDetail
      .mockRejectedValueOnce(new AppError('Không kết nối được tới máy chủ.'))
      .mockResolvedValueOnce(COMPLETED_MAKEUP);
    const { user } = await renderDetail();

    await user.press(
      await screen.findByRole('button', { name: 'Thử lại' }, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    );

    expect(await screen.findByText('Phương trình bậc hai')).toBeOnTheScreen();
    expect(api.getSessionDetail).toHaveBeenCalledTimes(2);
  });
});
