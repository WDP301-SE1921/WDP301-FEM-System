import type { PickImageOptions, PickImageProblem } from '@/lib/image-picker';

/**
 * Thong bao cho tai khoan khong dung app mobile (giao vien, nhan su trung tam): hien duoi form dang
 * nhap va tren man hinh chan phien cu da luu.
 */
export const MOBILE_ACCESS_DENIED_MESSAGE =
  'Ứng dụng chỉ dành cho phụ huynh và học sinh. Giáo viên và nhân viên trung tâm vui lòng dùng EduGrade trên web.';

/** `code` cua `AppError` khi chan dang nhap. Ma cua app, BE khong tra ma nay. */
export const MOBILE_ACCESS_DENIED_CODE = 'MOBILE_ACCESS_DENIED';

/** Gioi han anh dai dien cua `PUT /auth/me/avatar`. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Anh dai dien cat vuong truoc khi gui, vi app hien anh trong khung tron. */
export const AVATAR_PICK_OPTIONS: PickImageOptions = {
  maxBytes: AVATAR_MAX_BYTES,
  fileNamePrefix: 'anh-dai-dien',
  aspect: [1, 1],
};

/**
 * Link xem anh dai dien BE ky 900 giay: lay link moi truoc khi het han hai phut, de anh chua co trong
 * cache van tai duoc.
 */
export const AVATAR_URL_STALE_MS = 13 * 60_000;

export const AVATAR_PICK_PROBLEMS: Record<PickImageProblem, string> = {
  PERMISSION_DENIED:
    'Ứng dụng chưa được phép dùng camera. Mở Cài đặt để cho phép, hoặc bấm "Chọn ảnh có sẵn".',
  UNSUPPORTED: 'Chỉ dùng được ảnh JPG hoặc PNG. Hãy chọn ảnh khác.',
  TOO_LARGE: 'Ảnh lớn hơn 5 MB. Hãy chụp lại hoặc chọn ảnh khác.',
  FAILED: 'Không mở được camera hoặc thư viện ảnh trên máy này.',
};
