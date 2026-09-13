import { z } from 'zod';

/** Schema dung chung cho form (react-hook-form) va validate payload. */
export const loginSchema = z.object({
  email: z.string().min(1, 'Vui long nhap email').email('Email khong hop le'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
});

export const registerSchema = loginSchema
  .extend({
    fullName: z.string().min(2, 'Vui long nhap ho ten'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mat khau xac nhan khong khop',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
