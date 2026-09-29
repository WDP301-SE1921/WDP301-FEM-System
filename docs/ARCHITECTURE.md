# Kien truc du an

## Nguyen tac

1. **Feature-based, khong phai type-based.** Code cua mot nghiep vu nam chung mot cho (`src/features/<ten>/`), khong rai ra `components/`, `hooks/`, `services/`.
2. **Route mong.** File trong `src/app/` chi lap ghep va dieu huong. Logic nam trong `src/features/`.
3. **Mot chieu phu thuoc.** `app/` -> `features/` -> `api/` + `lib/`. Khong bao gio nguoc lai, va cac `features/` khong import cheo lan nhau (can chia se thi dua len `components/` hoac `lib/`). Bang day du o muc [Luat phu thuoc](#luat-phu-thuoc-eslint-ep-buoc).

## Cay thu muc

```
src/
├── app/                      # Route cua expo-router (file = URL)
│   ├── _layout.tsx           # Layout goc: provider + splash + Stack
│   ├── index.tsx             # Cong vao, dieu huong theo trang thai dang nhap
│   ├── add-child.tsx         # Phu huynh da dang nhap dung ma lien ket de them con
│   ├── +not-found.tsx
│   ├── (auth)/               # Nhom route cho nguoi chua dang nhap
│   │   ├── _layout.tsx       # Chan nguoi da dang nhap
│   │   ├── welcome.tsx       # Man hinh chao, cong vao khi chua dang nhap
│   │   ├── link-code.tsx     # Dung ma lien ket de tao tai khoan phu huynh
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/               # Nhom route chinh, co bottom tab
│       ├── _layout.tsx       # Chan nguoi chua dang nhap + cau hinh tab
│       ├── index.tsx         # Trang chu (phu huynh: tong quan cua con)
│       ├── schedule.tsx      # Lich hoc (phu huynh: lich tuan cua con)
│       ├── grades.tsx        # Diem & bai tap (chua lam)
│       ├── notifications.tsx # Thong bao (chua lam)
│       └── profile.tsx       # Tai khoan
│
├── api/                      # Tang giao tiep HTTP
│   ├── client.ts             # Axios instance, interceptor, tu dong refresh token
│   ├── endpoints.ts          # Tap trung duong dan API
│   ├── mocks/                # Server gia cho endpoint BE chua co (xem muc Mock API)
│   └── query-client.ts       # Cau hinh React Query + query key factory
│
├── components/
│   ├── ui/                   # Primitive khong biet gi ve nghiep vu (Button, Input, ThemedText)
│   └── common/               # Khoi ghep tu ui/ (Screen, cac State, FormInput, FormError)
│
├── features/                 # Mot thu muc = mot nghiep vu
│   └── auth/
│       ├── api/              # Ham goi API rieng cua feature
│       ├── components/       # Form, UI co logic cua feature (login-form, register-form)
│       ├── hooks/            # useLogin, useRegister, useLogout...
│       ├── schemas.ts        # Zod schema cho form va validate
│       ├── types.ts
│       └── index.ts          # Cong public cua feature, noi khac chi import tu day
│
├── constants/                # theme.ts (token), config.ts (env), messages.ts, storage-keys.ts, images.ts
├── hooks/                    # Hook dung chung toan app
├── lib/                      # Ha tang: storage, logger
├── providers/                # app-providers.tsx, noi duy nhat khai bao provider toan cuc
├── store/                    # State toan cuc (Zustand)
├── types/                    # Kieu dung chung (response API, User cua phien dang nhap...)
└── utils/                    # Ham thuan tuy, khong phu thuoc React
```

## Luat phu thuoc (ESLint ep buoc)

Cac luat duoi day nam trong `eslint.structure.js` va bao **loi** khi `npm run lint`, khi commit (lint-staged) va tren CI. Muon doi luat thi sua `eslint.structure.js` va bang nay trong cung mot PR. Khong dung `eslint-disable` de lach.

| Tang                | Chi duoc import (ngoai chinh no)                                      |
| ------------------- | --------------------------------------------------------------------- |
| `app/`              | features, providers, components, hooks, constants, types, utils       |
| `providers/`        | features, api, store, lib, components, hooks, constants, types, utils |
| `features/<ten>/`   | api, store, lib, components, hooks, constants, types, utils           |
| `components/common` | components/ui, hooks, constants, types, utils                         |
| `components/ui`     | hooks, constants, types, utils                                        |
| `store/`            | api, lib, constants, types, utils                                     |
| `hooks/`            | store, lib, constants, types, utils                                   |
| `api/`              | lib, constants, types, utils                                          |
| `lib/`              | constants, types, utils                                               |
| `utils/`            | constants, types                                                      |
| `constants/`        | types                                                                 |
| `types/`            | khong tang nao                                                        |

Luat bo sung:

- **Cau truc feature co dinh:** `index.ts`, `schemas.ts`, `types.ts`, tuy chon `constants.ts` va `utils.ts`, cung ba thu muc phang `api/`, `components/`, `hooks/`. File dat o bat ky vi tri nao khac trong `src/` (ke ca thu muc moi ngang hang `features/`) deu bao loi.
- **Cong public cua feature:** ben ngoai chi import `@/features/<ten>`, khong import sau vao file ben trong. Ben trong feature dung duong dan tuong doi va khong duoc ra khoi thu muc feature, khong import feature khac.
- **Duong dan `../`** bi cam ngoai feature, dung alias `@/`. Import `./` trong cung thu muc van duoc phep.
- **Thu vien co chu:** `axios` chi dung trong `api/`. `expo-secure-store` va AsyncStorage chi dung trong `lib/`. `@/api/client` chi dung trong `api/`, `store/` va `features/<ten>/api/`.
- **Route mong:** `app/` khong dung `react-hook-form`, `zod`, React Query, Zustand. Form va UI co logic nam trong `features/<ten>/components/`, route chi lap ghep va dieu huong.
- **Component dung chung** (`components/`) khong dung React Query, Zustand. **`utils/`** khong dung React, React Native, Expo Router, React Query, Zustand.
- **Chi file route duoc `export default`.** Moi file khac trong `src/` dung named export.
- File test (`src/__tests__/`, `*.test.ts(x)`) khong bi ap cac luat tren.

## Thanh phan dung chung

Tim o day truoc khi viet moi. Them thanh phan dung chung moi khi co it nhat hai cho dung that, va cap nhat bang nay.

| Can gi                                        | Dung                                                                                      | O dau                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------- |
| Khung man hinh (safe area, scroll, padding)   | `Screen`                                                                                  | `components/common`  |
| Trang thai dang tai / loi / rong              | `LoadingState`, `ErrorState`, `EmptyState`                                                | `components/common`  |
| O nhap noi voi react-hook-form                | `FormInput`                                                                               | `components/common`  |
| Loi chung cua form (loi tu server)            | `FormError`                                                                               | `components/common`  |
| Nut hien / an mat khau (dat o `trailing`)     | `PasswordVisibilityToggle`                                                                | `components/common`  |
| Sheet truot tu duoi len (chon con, chon tuan) | `BottomSheet`                                                                             | `components/common`  |
| Nut, o nhap, chu, khung theo theme            | `Button`, `Input`, `ThemedText`, `ThemedView`                                             | `components/ui`      |
| Icon theo theme (boc Ionicons)                | `Icon`, kieu `IconName`                                                                   | `components/ui`      |
| Link mo trinh duyet trong app                 | `ExternalLink`                                                                            | `components/ui`      |
| Mau theo che do sang / toi                    | `useTheme()`                                                                              | `hooks`              |
| Tri hoan gia tri (o tim kiem)                 | `useDebounce()`                                                                           | `hooks`              |
| Format tien, ngay, cat chuoi, chu cai dau     | `formatCurrency`, `formatDate`, `truncate`, `getInitials`                                 | `utils/format`       |
| Format gio, thu, thoi gian tuong doi, ten     | `formatTime`, `formatWeekdayDate`, `formatRelativeTime`, `getShortName`                   | `utils/format`       |
| Format ngay/thang, thu viet tat (`T2`, `CN`)  | `formatDayMonth`, `formatShortWeekday`                                                    | `utils/format`       |
| Tinh ngay, tuan (Thu Hai), khoa `YYYY-MM-DD`  | `startOfDay`, `startOfWeek`, `addDays`, `diffInCalendarDays`, `toDateKey`, `parseDateKey` | `utils/date`         |
| Thong bao loi hien cho nguoi dung             | `getErrorMessage()`                                                                       | `utils/error`        |
| Chuoi loi chung (mat mang, qua thoi gian)     | `ErrorMessages`                                                                           | `constants/messages` |
| Thong bao theo `error.code` cua BE            | `ApiErrorMessages`, `getApiErrorMessage()`                                                | `constants`, `utils` |
| Luu token / du lieu thuong                    | `secureStorage`, `storage`                                                                | `lib/storage`        |
| Ghi log                                       | `logger`                                                                                  | `lib/logger`         |
| Duong dan API, query key                      | `Endpoints`, `queryKeys`                                                                  | `api/`               |

## Chon cong cu cho tung loai state

| Loai state                               | Dung gi                   |
| ---------------------------------------- | ------------------------- |
| Du lieu tu server (list, detail, submit) | React Query               |
| Phien dang nhap, theme, setting toan app | Zustand (`src/store/`)    |
| State cua mot man hinh / component       | `useState` / `useReducer` |
| Gia tri form                             | React Hook Form + Zod     |

**Khong** luu du lieu server vao Zustand. React Query da lo cache, loading, error, refetch.

## Luong xac thuc

```
Mo app
  └─ AppProviders goi authStore.hydrate()
       ├─ doc accessToken tu SecureStore + user tu AsyncStorage
       └─ isHydrated = true  ->  an splash screen
            ├─ isAuthenticated = true   -> (tabs)
            └─ isAuthenticated = false  -> (auth)/welcome

Moi request
  └─ interceptor gan header Authorization

Gap 401
  └─ tu dong goi /auth/refresh (gom nhieu request 401 vao 1 lan refresh)
       ├─ thanh cong -> chay lai request cu
       └─ that bai   -> signOut() -> ve man hinh login
```

Token nam trong SecureStore (Keychain tren iOS, Keystore tren Android), khong nam trong AsyncStorage. Tren web SecureStore khong ton tai nen `src/lib/storage.ts` tu dong fallback ve AsyncStorage.

## Them mot feature moi

1. Tao `src/features/<ten>/` voi `api/`, `hooks/`, `types.ts`, `index.ts`.
2. Them duong dan API vao `src/api/endpoints.ts`.
3. Them query key vao `queryKeys` trong `src/api/query-client.ts`.
4. Dat UI cua man hinh (form, danh sach) trong `src/features/<ten>/components/` va export qua `index.ts`.
5. Tao route trong `src/app/(tabs)/<ten>.tsx`, chi import tu `@/features/<ten>` va chi lap ghep component.
6. Viet test cho phan logic thuan tuy (`utils`, `schemas`).
7. Chay `npm run lint`: dat sai tang hay import sai chieu se bao loi ngay.

## Bien moi truong

Chi dung bien co prefix `EXPO_PUBLIC_`, doc qua `src/constants/config.ts` (fail-fast neu thieu).

> `EXPO_PUBLIC_*` bi **inline thang vao file bundle** va ai cung doc duoc.
> Khong bao gio dat API key rieng tu, secret, hay chuoi ket noi DB o day.

## Mock API

Endpoint BE chua co thi mock o tang HTTP, khong mock trong feature:

- `src/api/mocks/` la server gia, gan vao `apiClient` bang axios adapter khi `EXPO_PUBLIC_API_MOCK=true`. Chi request trung route mock bi chan, request khac van goi BE that. `config.ts` bao loi neu bat mock khi `EXPO_PUBLIC_ENV=production`.
- Mock tra dung envelope, HTTP status va `error.code` cua BE (lay tu DTO hoac `EDUGRADE_BACKEND_FLOW.md`), va gia lap `ValidationPipe` (thua hoac thieu field thi 400). Nho vay `features/<ten>/api/`, interceptor va `normalizeError` chay y nhu voi BE that.
- Them mock: tao `src/api/mocks/<module>.ts` export mang `MockRoute` dung URL tu `Endpoints`, them vao `MOCK_ROUTES` trong `src/api/mocks/index.ts`, ghi ma/du lieu dung thu o dau file.
- BE xong endpoint: xoa route mock (va file neu rong), khong sua feature. Doi chieu DTO that, lech thi sua `types.ts` cua feature.

## Cau hinh theo moi truong

`app.config.ts` doc bien `APP_VARIANT` de doi ten app, bundle id va scheme:

| APP_VARIANT   | Ten app     | Bundle id                |
| ------------- | ----------- | ------------------------ |
| `development` | FEM Dev     | `com.wdp301.fem.dev`     |
| `preview`     | FEM Staging | `com.wdp301.fem.preview` |
| `production`  | FEM System  | `com.wdp301.fem`         |

Nho bundle id khac nhau nen ca ba ban co the cai song song tren cung mot may.
