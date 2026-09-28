import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 6;

/** Schema dung chung cho form (react-hook-form) va validate payload. */
export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`),
});

export const registerSchema = loginSchema
  .extend({
    fullName: z.string().min(2, 'Vui lòng nhập họ tên'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
