import { z } from 'zod';

import { startOfDay } from '@/utils/date';

import { CHILD_GRADES, FULL_NAME_MAX_LENGTH, FULL_NAME_MIN_LENGTH } from './constants';
import { parseBirthDate } from './utils';

/** Ngay sinh khong bat buoc (cot `dateOfBirth` cua StudentProfile nullable). */
const birthDateSchema = z
  .string()
  .refine(
    (text) => text === '' || parseBirthDate(text) !== null,
    'Ngày sinh không hợp lệ, nhập theo dạng ngày/tháng/năm',
  )
  .refine((text) => {
    const birthDate = parseBirthDate(text);
    return !birthDate || birthDate <= startOfDay(new Date());
  }, 'Ngày sinh không được sau hôm nay');

/** Form tao ho so con, theo cac cot cua StudentProfile: ho ten, khoi, ngay sinh. */
export const addChildSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(FULL_NAME_MIN_LENGTH, 'Vui lòng nhập họ tên học sinh')
    .max(FULL_NAME_MAX_LENGTH, 'Họ tên quá dài'),
  grade: z.literal(CHILD_GRADES, { error: 'Vui lòng chọn khối của học sinh' }),
  dateOfBirth: birthDateSchema,
});

export type AddChildInput = z.infer<typeof addChildSchema>;
