import { z } from 'zod';

/** `ReasonDto` cua BE: ly do toi da 2000 ky tu. */
export const LEAVE_REASON_MAX_LENGTH = 2000;

/** Form xin nghi mot buoi: chi can ly do, buoi va con lay tu man chi tiet buoi. */
export const sessionLeaveSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Nhập lý do xin nghỉ để trung tâm biết.')
    .max(LEAVE_REASON_MAX_LENGTH, `Lý do tối đa ${LEAVE_REASON_MAX_LENGTH} ký tự.`),
});

export type SessionLeaveValues = z.infer<typeof sessionLeaveSchema>;
