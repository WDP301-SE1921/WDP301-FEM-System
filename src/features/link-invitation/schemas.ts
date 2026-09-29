import { z } from 'zod';

import { LINK_CODE_LENGTH } from './constants';

const LINK_CODE_PATTERN = /^[A-Z0-9]+$/;
const PASSWORD_MIN_LENGTH = 8;
/** BE gioi han 72 vi bcrypt cat bo phan sau 72 byte. */
const PASSWORD_MAX_LENGTH = 72;

/**
 * O nhap da chuan hoa ma bang `normalizeLinkCode` truoc khi vao form, schema chi kiem tra.
 * Gia dinh BE phat ma in hoa: BE so khop hash cua ma tho nen viet hoa phia client chi dung khi do.
 */
export const linkCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'Vui lòng nhập mã liên kết')
    .length(LINK_CODE_LENGTH, `Vui lòng nhập đủ ${LINK_CODE_LENGTH} ký tự`)
    .regex(LINK_CODE_PATTERN, 'Mã liên kết chỉ gồm chữ in hoa và số'),
});

/**
 * Form tao tai khoan tu ma lien ket. Khong co email: BE lay email co dinh tu ma (§6.4).
 * `acceptTerms` chi kiem tra o client, BE khong nhan field nay.
 */
export const claimSignUpSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`)
      .max(PASSWORD_MAX_LENGTH, `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`),
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine((isAccepted) => isAccepted, 'Vui lòng đồng ý với điều khoản để tiếp tục'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export type LinkCodeInput = z.infer<typeof linkCodeSchema>;
export type ClaimSignUpInput = z.infer<typeof claimSignUpSchema>;
