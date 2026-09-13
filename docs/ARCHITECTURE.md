# Kien truc du an

## Nguyen tac

1. **Feature-based, khong phai type-based.** Code cua mot nghiep vu nam chung mot cho (`src/features/<ten>/`), khong rai ra `components/`, `hooks/`, `services/`.
2. **Route mong.** File trong `src/app/` chi lap ghep va dieu huong. Logic nam trong `src/features/`.
3. **Mot chieu phu thuoc.** `app/` -> `features/` -> `api/` + `lib/`. Khong bao gio nguoc lai, va cac `features/` khong import cheo lan nhau (can chia se thi dua len `components/` hoac `lib/`).

## Cay thu muc

```
src/
├── app/                      # Route cua expo-router (file = URL)
│   ├── _layout.tsx           # Layout goc: provider + splash + Stack
│   ├── index.tsx             # Cong vao, dieu huong theo trang thai dang nhap
│   ├── +not-found.tsx
│   ├── (auth)/               # Nhom route cho nguoi chua dang nhap
│   │   ├── _layout.tsx       # Chan nguoi da dang nhap
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/               # Nhom route chinh, co bottom tab
│       ├── _layout.tsx       # Chan nguoi chua dang nhap + cau hinh tab
│       ├── index.tsx
│       └── profile.tsx
│
├── api/                      # Tang giao tiep HTTP
│   ├── client.ts             # Axios instance, interceptor, tu dong refresh token
│   ├── endpoints.ts          # Tap trung duong dan API
│   └── query-client.ts       # Cau hinh React Query + query key factory
│
├── components/
│   ├── ui/                   # Primitive khong biet gi ve nghiep vu (Button, Input, ThemedText)
│   └── common/               # Khoi dung chung (Screen, LoadingState, EmptyState, ErrorState)
│
├── features/                 # Mot thu muc = mot nghiep vu
│   └── auth/
│       ├── api/              # Ham goi API rieng cua feature
│       ├── components/       # Component chi dung trong feature nay
│       ├── hooks/            # useLogin, useRegister, useLogout...
│       ├── schemas.ts        # Zod schema cho form va validate
│       ├── types.ts
│       └── index.ts          # Cong public cua feature, noi khac chi import tu day
│
├── constants/                # theme.ts (design token), config.ts (env), storage-keys.ts
├── hooks/                    # Hook dung chung toan app
├── lib/                      # Ha tang: storage, logger
├── providers/                # app-providers.tsx, noi duy nhat khai bao provider toan cuc
├── store/                    # State toan cuc (Zustand)
├── types/                    # Kieu dung chung
└── utils/                    # Ham thuan tuy, khong phu thuoc React
```

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
            └─ isAuthenticated = false  -> (auth)/login

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
4. Tao route trong `src/app/(tabs)/<ten>.tsx`, chi import tu `@/features/<ten>`.
5. Viet test cho phan logic thuan tuy (`utils`, `schemas`).

## Bien moi truong

Chi dung bien co prefix `EXPO_PUBLIC_`, doc qua `src/constants/config.ts` (fail-fast neu thieu).

> `EXPO_PUBLIC_*` bi **inline thang vao file bundle** va ai cung doc duoc.
> Khong bao gio dat API key rieng tu, secret, hay chuoi ket noi DB o day.

## Cau hinh theo moi truong

`app.config.ts` doc bien `APP_VARIANT` de doi ten app, bundle id va scheme:

| APP_VARIANT   | Ten app     | Bundle id                |
| ------------- | ----------- | ------------------------ |
| `development` | FEM Dev     | `com.wdp301.fem.dev`     |
| `preview`     | FEM Staging | `com.wdp301.fem.preview` |
| `production`  | FEM System  | `com.wdp301.fem`         |

Nho bundle id khac nhau nen ca ba ban co the cai song song tren cung mot may.
