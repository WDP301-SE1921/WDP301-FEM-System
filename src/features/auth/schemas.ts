import { z } from 'zod';

import { extractVerificationToken } from './utils';

/** Gioi han theo LoginDto, RegisterParentDto va ChangePasswordDto cua BE. */
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

/** Mat khau moi dat khi dang ky hoac doi mat khau. */
const newPasswordSchema = passwordSchema.max(
  PASSWORD_MAX_LENGTH,
  `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`,
);

const displayNameSchema = z
  .string()
  .trim()
  .min(DISPLAY_NAME_MIN_LENGTH, 'Vui lòng nhập họ tên')
  .max(DISPLAY_NAME_MAX_LENGTH, 'Họ tên quá dài');

/** Khong bat buoc: bo trong thi khong gui len BE. */
const phoneSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || PHONE_PATTERN.test(value), 'Số điện thoại không hợp lệ');

/**
 * Cat khoang trang hai dau truoc khi kiem tra: ban phim hay tu them dau cach sau khi chon goi y, va BE
 * cung tu cat (LoginDto, RegisterParentDto).
 */
const emailSchema = z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ');

/** Schema dung chung cho form (react-hook-form) va validate payload. */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = loginSchema
  .extend({
    displayName: displayNameSchema,
    /** Trung tam chi dung de lien he (SRS muc 5.11). */
    phone: phoneSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

/** Body POST /auth/verify-email. Phu huynh dan tu email, co the dan ca cau chua ma. */
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .transform(extractVerificationToken)
    .pipe(
      z
        .string()
        .min(1, 'Vui lòng dán mã xác minh')
        .min(VERIFY_TOKEN_MIN_LENGTH, 'Mã xác minh chưa đủ, hãy dán toàn bộ mã trong email'),
    ),
});

/** Body POST /auth/forgot-password. */
export const forgotPasswordSchema = loginSchema.pick({ email: true });

/** Form doi mat khau. `confirmPassword` chi de validate o client. */
export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  });

/**
 * Form sua thong tin tai khoan (UpdateProfileDto). BE khong tra so dien thoai dang luu, nen o so dien
 * thoai de trong va chi gui khi phu huynh nhap so moi.
 */
export const accountProfileSchema = z.object({
  displayName: displayNameSchema,
  phone: phoneSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AccountProfileInput = z.infer<typeof accountProfileSchema>;
