# WDP301 FEM System - Mobile (React Native)

Ung dung mobile cua he thong FEM, viet bang React Native + Expo.

| Thanh phan   | Cong nghe                            |
| ------------ | ------------------------------------ |
| Framework    | Expo SDK 57 / React Native 0.86      |
| Ngon ngu     | TypeScript (strict)                  |
| Dieu huong   | expo-router (file-based routing)     |
| Server state | TanStack React Query                 |
| Client state | Zustand                              |
| Form         | React Hook Form + Zod                |
| HTTP         | Axios (co interceptor refresh token) |
| Test         | Jest + Testing Library               |

## Yeu cau moi truong

- **Node.js >= 20.19.4** (khuyen dung 22 LTS)
- npm 10 tro len
- Dien thoai cai **Expo Go**, hoac Android Studio / Xcode neu chay may ao

## Cai dat

```bash
git clone https://github.com/WDP301-SE1921/WDP301-FEM-System.git
cd WDP301-FEM-System

npm install          # tu dong cai luon git hook (husky)
cp .env.example .env # sua EXPO_PUBLIC_API_URL tro toi backend cua ban
```

> Neu chay backend o may local va test tren dien thoai that, dat `EXPO_PUBLIC_API_URL`
> theo **IP LAN** cua may (vi du `http://192.168.1.10:8080/api/v1`), khong dung `localhost`.

## Chay app

```bash
npm start        # mo Metro, quet QR bang Expo Go
npm run android  # mo thang tren may ao / thiet bi Android
npm run ios      # mo thang tren simulator iOS (can macOS)
npm run web      # chay tren trinh duyet
npm run start:clear  # xoa cache Metro khi gap loi la
```

## Cac lenh hay dung

| Lenh                 | Tac dung                                       |
| -------------------- | ---------------------------------------------- |
| `npm run validate`   | **Chay truoc moi PR**: typecheck + lint + test |
| `npm run typecheck`  | Kiem tra kieu TypeScript                       |
| `npm run lint`       | Kiem tra ESLint                                |
| `npm run lint:fix`   | Tu sua loi ESLint sua duoc                     |
| `npm run format`     | Format toan bo code bang Prettier              |
| `npm test`           | Chay test                                      |
| `npm run test:watch` | Chay test o che do theo doi                    |
| `npm run doctor`     | Kiem tra do tuong thich cua dependency Expo    |
| `npm run prebuild`   | Sinh thu muc `android/` `ios/` khi can native  |

## Cau truc thu muc

```
src/
├── app/          # Route (expo-router) - file la URL
├── api/          # Axios client, endpoint, cau hinh React Query
├── components/   # ui/ (primitive) + common/ (khoi dung chung)
├── features/     # Mot thu muc = mot nghiep vu (auth, order, ...)
├── constants/    # Design token, config env, storage key
├── hooks/        # Hook dung chung
├── lib/          # storage, logger
├── providers/    # Provider toan cuc
├── store/        # State toan cuc (Zustand)
├── types/        # Kieu dung chung
└── utils/        # Ham thuan tuy
```

Chi tiet: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Tai lieu

| Tai lieu                                            | Noi dung                                   |
| --------------------------------------------------- | ------------------------------------------ |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)             | Kien truc, cay thu muc, luong xac thuc     |
| [GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)             | Nhanh, commit, PR, branch protection       |
| [CODING_CONVENTIONS.md](docs/CODING_CONVENTIONS.md) | Quy uoc dat ten, import, style, TypeScript |
| [CONTRIBUTING.md](CONTRIBUTING.md)                  | Bat dau dong gop tu dau                    |

## Chat luong code duoc ep tu dong

| Luc nao      | Chay gi                                               |
| ------------ | ----------------------------------------------------- |
| `git commit` | lint-staged (ESLint + Prettier tren file thay doi)    |
| `git commit` | commitlint (kiem tra dinh dang commit message)        |
| `git push`   | `npm run typecheck`                                   |
| Mo PR        | GitHub Actions: typecheck, lint, format, test, bundle |

## Build ban cai dat (EAS)

```bash
npm i -g eas-cli
eas login
eas init                                    # ghi projectId, dat vao EAS_PROJECT_ID
eas build --profile preview --platform android   # ra file APK de test noi bo
```

Ba profile trong `eas.json`: `development` (dev client), `preview` (APK noi bo), `production` (ban phat hanh).

## Xu ly su co

| Van de                          | Cach xu ly                                            |
| ------------------------------- | ----------------------------------------------------- |
| Metro loi la, import khong thay | `npm run start:clear`                                 |
| Dien thoai khong goi duoc API   | Doi `EXPO_PUBLIC_API_URL` sang IP LAN, tat firewall   |
| Doi `.env` ma khong an          | Tat Metro roi chay lai (`.env` chi doc luc khoi dong) |
| Version dependency lech nhau    | `npm run doctor`                                      |
| Hook khong chay                 | `npm install` lai (husky cai qua script `prepare`)    |
