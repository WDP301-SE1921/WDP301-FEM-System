import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { queryKeys } from '@/api/query-client';
import { ApiErrorMessages } from '@/constants/messages';
import { childrenApi } from '@/features/children/api/children-api';
import { ChildrenSection } from '@/features/children/components/children-section';
import { EditChildFlow } from '@/features/children/components/edit-child-flow';
import type { ChildProfile } from '@/features/children/types';
import { AppError } from '@/types/api';

jest.mock('@/features/children/api/children-api', () => ({
  childrenApi: { list: jest.fn(), update: jest.fn() },
}));

const api = jest.mocked(childrenApi);

/** Icon trong Button la Text chua glyph, nen ten nut co them ky tu ngoai chu. */
const SAVE_BUTTON_NAME = /Lưu thay đổi$/;
/** Lan render dau phai transform nhieu module, mat hon 1 giay mac dinh cua findBy khi CI. */
const FIRST_RENDER_TIMEOUT_MS = 5000;

const MINH_ANH: ChildProfile = {
  id: 'student-1',
  fullName: 'Nguyễn Minh Anh',
  grade: 8,
  dateOfBirth: '2013-03-15T00:00:00.000Z',
};
const HOANG_LONG: ChildProfile = {
  id: 'student-2',
  fullName: 'Nguyễn Hoàng Long',
  grade: 6,
  dateOfBirth: null,
};

function createQueryClient() {
  // gcTime vo han de React Query khong hen gio don cache, giu Jest khong thoat sau khi test xong
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
}

async function renderEditFlow(studentId: string = MINH_ANH.id) {
  const onBack = jest.fn();
  const onDone = jest.fn();
  const queryClient = createQueryClient();
  const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');
  await render(
    <QueryClientProvider client={queryClient}>
      <EditChildFlow studentId={studentId} onBack={onBack} onDone={onDone} />
    </QueryClientProvider>,
  );
  return { onBack, onDone, invalidateQueries, user: userEvent.setup() };
}

describe('features/children/EditChildFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.list.mockResolvedValue([MINH_ANH, HOANG_LONG]);
  });

  it('dien san ho so hien tai; luu thi gui du ba field, tai lai danh sach con roi quay lai', async () => {
    api.update.mockResolvedValue({ ...MINH_ANH, fullName: 'Nguyễn Ngọc Minh Anh' });
    const { onDone, invalidateQueries, user } = await renderEditFlow();

    const nameInput = await screen.findByDisplayValue(
      'Nguyễn Minh Anh',
      {},
      { timeout: FIRST_RENDER_TIMEOUT_MS },
    );
    expect(screen.getByRole('radio', { name: 'Lớp 8' })).toBeChecked();
    expect(screen.getByDisplayValue('15/03/2013')).toBeOnTheScreen();

    await user.clear(nameInput);
    await user.type(nameInput, 'Nguyễn Ngọc Minh Anh');
    await user.press(screen.getByRole('button', { name: SAVE_BUTTON_NAME }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(api.update).toHaveBeenCalledWith(MINH_ANH.id, {
      fullName: 'Nguyễn Ngọc Minh Anh',
      grade: 8,
      dateOfBirth: '2013-03-15',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.me.students,
      exact: true,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.parent.students,
      exact: true,
    });
  });

  it('xoa ngay sinh thi gui null; doi lop khi con dang hoc thi hien loi cua BE', async () => {
    api.update.mockRejectedValue(
      new AppError(ApiErrorMessages.STUDENT_GRADE_LOCKED ?? '', 409, 'STUDENT_GRADE_LOCKED'),
    );
    const { onDone, user } = await renderEditFlow();

    const birthInput = await screen.findByDisplayValue(
      '15/03/2013',
      {},
      { timeout: FIRST_RENDER_TIMEOUT_MS },
    );
    await user.clear(birthInput);
    await user.press(screen.getByRole('radio', { name: 'Lớp 9' }));
    await user.press(screen.getByRole('button', { name: SAVE_BUTTON_NAME }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không đổi được lớp khi học sinh đang có môn học tại trung tâm.',
    );
    expect(api.update).toHaveBeenCalledWith(MINH_ANH.id, {
      fullName: 'Nguyễn Minh Anh',
      grade: 9,
      dateOfBirth: null,
    });
    expect(onDone).not.toHaveBeenCalled();
  });

  it('ho so khong thuoc tai khoan thi bao khong tim thay va cho quay lai', async () => {
    const { onBack, user } = await renderEditFlow('student-khac');

    expect(
      await screen.findByText(
        'Không tìm thấy hồ sơ học sinh',
        {},
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: SAVE_BUTTON_NAME })).not.toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Quay lại' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(api.update).not.toHaveBeenCalled();
  });
});

describe('features/children/ChildrenSection', () => {
  beforeEach(() => jest.clearAllMocks());

  async function renderSection() {
    const onAddChild = jest.fn();
    const onEditChild = jest.fn();
    await render(
      <QueryClientProvider client={createQueryClient()}>
        <ChildrenSection onAddChild={onAddChild} onEditChild={onEditChild} />
      </QueryClientProvider>,
    );
    return { onAddChild, onEditChild, user: userEvent.setup() };
  }

  it('liet ke ho so con kem lop va ngay sinh; bam mot con de sua, bam nut de them con', async () => {
    api.list.mockResolvedValue([MINH_ANH, HOANG_LONG]);
    const { onAddChild, onEditChild, user } = await renderSection();

    await user.press(
      await screen.findByRole(
        'button',
        { name: 'Nguyễn Minh Anh, Lớp 8 · Sinh ngày 15/03/2013' },
        { timeout: FIRST_RENDER_TIMEOUT_MS },
      ),
    );
    expect(onEditChild).toHaveBeenCalledWith(MINH_ANH.id);
    // Con chua nhap ngay sinh thi chi hien lop
    expect(screen.getByRole('button', { name: 'Nguyễn Hoàng Long, Lớp 6' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Thêm học sinh' }));
    expect(onAddChild).toHaveBeenCalledTimes(1);
  });

  it('chua co ho so nao thi moi them con', async () => {
    api.list.mockResolvedValue([]);
    await renderSection();

    expect(
      await screen.findByText(/^Chưa có hồ sơ nào/, {}, { timeout: FIRST_RENDER_TIMEOUT_MS }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Thêm học sinh' })).toBeOnTheScreen();
  });
});
