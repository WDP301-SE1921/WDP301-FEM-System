/**
 * Anh tinh dung o nhieu man hinh. Test mock module nay: Jest map `@/*` sang `src/*` nen khong tim
 * thay `@/assets/*` (Metro thi tim thay nho `paths` trong tsconfig).
 */
export const Images = {
  logo: require('@/assets/images/edugrade-logo.jpg'),
} as const;
