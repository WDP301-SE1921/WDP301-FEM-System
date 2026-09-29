import { z } from 'zod';

/** Gioi han theo LoginDto va RegisterParentDto cua BE. */
const PASSWORD_MIN_LENGTH = 8;
/** BE chan mat khau qua 72 byte vi bcrypt cat bo phan sau. */
const PASSWORD_MAX_LENGTH = 72;
const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 255;

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`);

/** Schema dung chung cho form (react-hook-form) va validate payload. */
export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: passwordSchema,
});

export const registerSchema = loginSchema
  .extend({
    displayName: z
      .string()
      .trim()
      .min(DISPLAY_NAME_MIN_LENGTH, 'Vui lòng nhập họ tên')
      .max(DISPLAY_NAME_MAX_LENGTH, 'Họ tên quá dài'),
    password: passwordSchema.max(
      PASSWORD_MAX_LENGTH,
      `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`,
    ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
