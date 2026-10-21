import { z } from 'zod';

/** Gioi han theo LoginDto va RegisterParentDto cua BE. */
const PASSWORD_MIN_LENGTH = 8;
/** BE chan mat khau qua 72 byte vi bcrypt cat bo phan sau. */
const PASSWORD_MAX_LENGTH = 72;
const DISPLAY_NAME_MIN_LENGTH = 2;
const DISPLAY_NAME_MAX_LENGTH = 255;
/** Tu 8 toi 20 chu so va khoang trang ngan cach, cho phep dau `+` o dau; BE chi gioi han 32 ky tu. */
const PHONE_PATTERN = /^\+?\d[\d\s]{6,18}\d$/;
/** Gioi han cua VerifyEmailDto; ma BE gui qua email dai 43 ky tu. */
const VERIFY_TOKEN_MIN_LENGTH = 32;

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
    /** Khong bat buoc: trung tam chi dung de lien he (SRS muc 5.11), bo trong thi khong gui len BE. */
    phone: z
      .string()
      .trim()
      .refine((value) => value === '' || PHONE_PATTERN.test(value), 'Số điện thoại không hợp lệ'),
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

/** Body POST /auth/verify-email. Phu huynh dan ma tu email nen cat khoang trang hai dau. */
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, 'Vui lòng dán mã xác minh')
    .min(VERIFY_TOKEN_MIN_LENGTH, 'Mã xác minh chưa đủ, hãy dán toàn bộ mã trong email'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
