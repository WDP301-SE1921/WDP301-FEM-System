# WDP301 FEM System - Mobile (React Native)

App mobile cua **EduGrade**, nen tang quan ly hoc tap cua mot trung tam day them (Toan, Ly, Hoa, Sinh, khoi 6-9), do an WDP301-SE1921. Viet bang React Native + Expo.

## San pham

EduGrade co hai nen tang dung chung du lieu: Web cho nhan su trung tam (Quan ly trung tam, Thiet ke giao trinh, Nhan vien, Giao vien) va **Mobile cho phu huynh** (repo nay). Khong co tai khoan hoc sinh: phu huynh dang nhap, quan ly mot hoac nhieu ho so con, con nhan bai va nop bai qua phien dang nhap cua phu huynh.

Pham vi cua app theo SRS (mot so phan chua lam, vi du nop bai va xem dap an dung):

- Tu tao tai khoan va tu tao ho so con ngay tren app, khong can link hay ma kich hoat
- Quan ly nhieu con trong mot tai khoan va chuyen doi giua cac con
- Xem mon hoc, lop, lich hoc, lich hoc bu va goi hoc phi cua tung con
- Nhan va nop bai tap ve nha
- Xem diem kem dap an dung, lich su diem, ty le di hoc va tien do hoc tap

Dang ky lop, huy lop va thu hoc phi do Nhan vien lam tai trung tam, khong lam tren app. Thong bao gui qua email, khong dung SMS.

Dac ta day du: [docs/SRS.md](docs/SRS.md).

## Cong nghe

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
```

> App hien **chi dung mock data** (`src/api/mocks/`), khong goi backend nen khong can `.env` hay
> dia chi backend. Tai khoan dung thu ghi o dau cac file trong `src/api/mocks/`.

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
├── features/     # Mot thu muc = mot nghiep vu (auth, children, parent-dashboard, ...)
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

| Tai lieu                                            | Noi dung                                              |
| --------------------------------------------------- | ----------------------------------------------------- |
| [SRS.md](docs/SRS.md)                               | Dac ta yeu cau: vai tro, chuc nang, quy tac nghiep vu |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)             | Kien truc, cay thu muc, luong xac thuc                |
| [GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)             | Nhanh, commit, PR, branch protection                  |
| [CODING_CONVENTIONS.md](docs/CODING_CONVENTIONS.md) | Quy uoc dat ten, import, style, TypeScript            |
| [CONTRIBUTING.md](CONTRIBUTING.md)                  | Bat dau dong gop tu dau                               |

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
| Doi `.env` ma khong an          | Tat Metro roi chay lai (`.env` chi doc luc khoi dong) |
| Version dependency lech nhau    | `npm run doctor`                                      |
| Hook khong chay                 | `npm install` lai (husky cai qua script `prepare`)    |
