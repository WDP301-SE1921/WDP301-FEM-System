# Quy uoc viet code

## Dat ten file

| Loai          | Quy uoc                  | Vi du                           |
| ------------- | ------------------------ | ------------------------------- |
| Component     | `kebab-case.tsx`         | `order-card.tsx`                |
| Hook          | `use-<ten>.ts`           | `use-debounce.ts`               |
| Route         | `kebab-case.tsx`         | `src/app/(tabs)/order-list.tsx` |
| Test          | `<ten>.test.ts(x)`       | `format.test.ts`                |
| Type / schema | `types.ts`, `schemas.ts` | -                               |

Trong code: component va type dung `PascalCase`, ham va bien dung `camelCase`, hang so dung object `as const`.

## Import

Luon dung alias `@/`, khong dung duong dan tuong doi nhieu cap:

```ts
// Dung
import { Button } from '@/components/ui/button';

// Sai
import { Button } from '../../../components/ui/button';
```

Duong dan tuong doi chi dung **trong cung mot feature** (vi du `./api/auth-api`).

Thu tu import do ESLint tu sap xep: built-in -> thu vien ngoai -> `@/` -> cha -> anh em.

## Component

- Uu tien `export function`, khong dung `export default` tru file route (expo-router bat buoc default export).
- Props khai bao bang `type`, dat ten `<Component>Props`, va export ra.
- Mot file mot component. Component phu chi de cung file khi khong dung o dau khac.
- Tach logic ra hook khi component vuot khoang 150 dong.

```tsx
export type OrderCardProps = {
  order: Order;
  onPress?: () => void;
};

export function OrderCard({ order, onPress }: OrderCardProps) {
  // ...
}
```

## Style

- Dung `StyleSheet.create` o cuoi file, **khong** viet style inline (tru gia tri phu thuoc theme hoac state).
- Khong hardcode mau hay khoang cach. Lay tu `@/constants/theme`:

```tsx
// Dung
padding: Spacing.three,
color: theme.primary,

// Sai
padding: 16,
color: '#208AEF',
```

## Goi API

- Khong goi `axios` truc tiep trong component. Di qua `features/<ten>/api/`.
- Doc du lieu dung `useQuery`, ghi du lieu dung `useMutation`.
- Moi man hinh phai xu ly du ba trang thai: loading, error, empty.

```tsx
if (isLoading) return <LoadingState />;
if (error) return <ErrorState error={error} onRetry={refetch} />;
if (!data?.length) return <EmptyState title="Chưa có dữ liệu" />;
```

- Hien loi cho nguoi dung bang `getErrorMessage(error)` (`@/utils/error`), khong doc thang `error.message`: chi `AppError` moi co thong bao than thien, loi khac se hien thong bao chung.

## Form

- Form nam trong `features/<ten>/components/<ten>-form.tsx`. Route chi render form, khong goi `useForm`.
- Schema Zod dat trong `features/<ten>/schemas.ts`, kieu form suy ra bang `z.infer`.
- O nhap dung `FormInput`, loi server dung `FormError`, nut submit dung `Button` voi `loading={mutation.isPending}`. Khong viet `Controller` bang tay.
- Man hinh co o nhap dat trong `Screen`: `Screen` da tu nang noi dung len khi ban phim mo, khong boc them `KeyboardAvoidingView` (boc hai lan thi noi dung bi day hai lan).

```tsx
<FormInput control={control} name="email" label="Email" keyboardType="email-address" />
<FormError error={login.error} />
<Button title="Đăng nhập" loading={login.isPending} onPress={onSubmit} />
```

## TypeScript

- `strict` va `noUncheckedIndexedAccess` dang bat. Khong tat.
- **Cam `any`.** Khong biet kieu thi dung `unknown` roi thu hep dan.
- Khong dung `as` de ep kieu cho qua chuyen, tru khi that su can va co comment giai thich.
- Bien khong dung dat ten bat dau bang `_`.

## Log

Dung `logger` trong `@/lib/logger`, khong goi `console.log` truc tiep (ESLint se canh bao). O production, `logger.debug` va `logger.info` tu dong im lang.

## Tieng Viet trong code

- Comment, tai lieu, commit message: tieng Viet.
- Ten bien, ten ham, ten file: **tieng Anh**.
- Chuoi hien thi cho nguoi dung: tieng Viet (co dau).

## Test

- Bat buoc test cho `utils/` va `schemas/` (logic thuan tuy, de test, de vo).
- Component quan trong thi test bang `@testing-library/react-native`, kiem tra hanh vi nguoi dung thay chu khong kiem tra chi tiet trien khai.
- Dat test trong `src/__tests__/` hoac canh file duoc test.

## Truoc khi mo PR

```bash
npm run validate   # typecheck + lint + test
```
