# CLAUDE.md

Huong dan cho Claude Code (claude.ai/code) khi lam viec trong repo nay.

App mobile cua he thong FEM: Expo SDK 57, React Native 0.86, React 19.2, TypeScript strict, expo-router, React Query, Zustand, React Hook Form + Zod, Axios.

`docs/ARCHITECTURE.md` va `docs/CODING_CONVENTIONS.md` la luat bat buoc va duoc nap tu dong o cuoi file nay. File nay chi bo sung nhung gi hai tai lieu do chua noi: lenh, cho de lam sai, design pattern va chuan clean code.

## Lenh

```bash
npm install                  # lan dau (cai luon husky hook)
cp .env.example .env         # bat buoc, thieu EXPO_PUBLIC_API_URL la app throw luc khoi dong
npm start                    # Metro + Expo Go (npm run start:clear neu Metro loi la)

npm run validate             # typecheck + lint + test:ci
npm run format:check         # CI co chay nhung validate KHONG chay -> phai chay rieng
npx jest src/__tests__/format.test.ts   # chay mot file test
npx jest -t "getInitials"               # chay test theo ten describe/it

npx expo install <package>   # them thu vien, KHONG dung npm install <package>
npm run doctor               # kiem tra lech version dependency cua Expo
npx expo export --platform android --output-dir dist   # thu bundle nhu job CI "Bundle check"
```

PowerShell doi variant: `$env:APP_VARIANT = 'preview'; npx expo start` (cu phap `APP_VARIANT=... npx` trong `app.config.ts` la cua bash).

## Nhung cho de lam sai

- **Cau truc thu muc bi ESLint ep** (`eslint.structure.js`, bang "Luat phu thuoc" trong `docs/ARCHITECTURE.md`). Lint bao loi cau truc thi chuyen code sang dung tang hoac dung chieu import. Khong dung `eslint-disable`, khong tu sua `eslint.structure.js` de cho qua; can doi luat thi hoi truoc.
- **React Compiler dang bat** (`experiments.reactCompiler` trong `app.config.ts`). Khong them `useMemo`, `useCallback`, `React.memo` theo thoi quen. Chi dung khi do duoc van de hieu nang, va ghi comment ly do.
- **Typed routes dang bat.** `href` cua `Link`, `Redirect`, `router.*` duoc kiem tra kieu. Them hoac doi ten route ma typecheck bao sai `href` thi chay `npx expo start` mot lan de sinh lai `.expo/types`.
- **File route bat buoc `export default`** (expo-router). Moi file khac dung named export.
- **Expo SDK 57 / RN 0.86 moi hon phan lon tai lieu cu.** Truoc khi dung API la, doc docs.expo.dev dung version. Them thu vien qua `npx expo install` de lay version khop SDK.
- **Env.** Moi bien `EXPO_PUBLIC_*` bi inline vao bundle nen khong dat secret. Doi `.env` phai tat Metro roi chay lai.
- **Envelope API.** Backend tra `ApiResponse<T> = { success: true, data }`, loi la `{ success: false, error: { code, message, requestId, details? } }` voi `message` tieng Anh. Ham trong `features/<ten>/api/` tra ve `data.data` da unwrap, hook va UI khong bao gio thay envelope. Moi loi den UI deu la `AppError` (`message` tieng Viet, `status`, `code`) do interceptor trong `api/client.ts` chuan hoa theo `ApiErrorMessages`. Can thong bao theo ngu canh thi feature doi trong tang `api/` cua minh (vd `toInvitationError`).
- **Mock API.** Endpoint BE chua co thi mock trong `src/api/mocks/` (xem muc "Mock API" trong `docs/ARCHITECTURE.md`), khong viet ham gia trong feature.
- **Auth.** Token chi doc/ghi qua `secureStorage` (`@/lib/storage`) voi key tu `StorageKeys`. Refresh khi gap 401 da nam trong interceptor (gom request dong thoi vao mot lan refresh), khong viet lai o feature. `api/` khong duoc import `store/`: store dang ky callback qua `setUnauthorizedHandler`.
- **Ngon ngu.** Ten bien, ham, file: tieng Anh. Comment va tai lieu: tieng Viet khong dau nhu code hien co. Chuoi UI: tieng Viet co dau. Chuoi loi dung chung nam trong `ErrorMessages` (`@/constants/messages`).
- **Gap code vi pham luat** thi code moi van theo luat, khong bat chuoc. Khong tu sua hang loat ngoai pham vi task; bao lai de nguoi dung quyet dinh.
- **Test component:** Testing Library v14 co `render` bat dong bo (`await render(...)`), dung `userEvent.setup()` de go va bam. Import `.css` trong test da duoc map sang `jest.style-mock.js`.

## Design pattern trong du an

Day la cac pattern repo da dung. Code moi di theo dung cac pattern nay, khong tu nghi them kieu to chuc khac.

- **Facade theo feature** (`features/auth/index.ts`). Moi feature chi lo API public qua `index.ts`. Noi khac import `@/features/<ten>`, khong import sau vao file ben trong feature.
- **Service boc HTTP** (`features/auth/api/auth-api.ts`). Moi feature co mot object `<ten>Api`, moi endpoint la mot ham async nhan input da co kieu va tra ve data da unwrap. Chi tang nay duoc goi `apiClient`.
- **Custom hook = mot use case** (`useLogin`, `useLogout`). Hook boc `useQuery`/`useMutation` va side effect di kem (luu phien, dieu huong, invalidate query). Screen chi goi hook, khong tu ghep logic nghiep vu.
- **Container / Presentational.** Component trong `features/<ten>/components/` la container: lay data tu hook, xu ly loading / error / empty. File route chi lap ghep cac container nay va dieu huong. `components/ui` va `components/common` la presentational: nhan props, phat su kien qua callback `onX`, khong goi API, khong doc store.
- **Singleton cap module** (`apiClient`, `queryClient`, `useAuthStore`). Dung lai instance co san, khong tao axios instance hay `QueryClient` moi.
- **Factory cho key va URL** (`queryKeys`, `Endpoints.users.detail(id)`). Moi query key va URL co tham so deu tao qua factory, khong viet mang hay chuoi tay.
- **Adapter cho thu vien ngoai** (`lib/storage.ts`, `lib/logger.ts`, `normalizeError`). Thu vien native hoac third-party dung o nhieu noi thi boc trong `lib/`, de doi thu vien chi phai sua mot file.
- **Dependency inversion bang callback** (`setUnauthorizedHandler`). Tang duoi can bao cho tang tren thi nhan callback, khong import nguoc.
- **Strategy / lookup map** (map `variant` trong `components/ui/button.tsx`). Re nhanh theo mot gia tri enum thi dung object `Record<Variant, ...>`, khong dung chuoi `if` hay ternary long nhau.
- **Schema la nguon su that** (`features/auth/schemas.ts`). Kieu cua form va payload suy ra bang `z.infer`, khong khai bao lai bang tay.
- **Observer co selector** (`useAuthStore((s) => s.user)`). Doc Zustand bang selector tung field, khong lay ca store.

**KISS / YAGNI.** Khong them lop truu tuong (base class, HOC, Context moi, generic factory) khi chua co it nhat hai cho dung that. Code don gian dung quy uoc tot hon pattern dat sai cho.

## SOLID ap vao React

- **S - Mot trach nhiem.** Mot component, hook, ham lam mot viec. Dau hieu can tach: ten phai co chu "And", component vuot khoang 150 dong, JSX long qua 3-4 cap, hook vua fetch vua format vua dieu huong.
- **O - Mo rong khong sua.** Them hanh vi bang prop, variant hoac entry moi trong map. Khong them co boolean de va tung truong hop (`isLoginPage`, `isSpecial`).
- **L - Giu hop dong cua primitive.** Component boc primitive thi ke thua props cua no (`Omit<PressableProps, 'style'> & {...}`) va chuyen `...rest` xuong, nhu `Button` va `Input`.
- **I - Props toi thieu.** Props chi chua thu component that su dung, khong them prop "de sau nay can".
- **D - Phu thuoc vao truu tuong.** Chieu goi la component -> hook -> `features/<ten>/api` -> `apiClient`. Component khong import `axios`, `apiClient`, `AsyncStorage`, `SecureStore`.

## Chuan clean code

1. **Dat ten noi len y dinh.** Boolean bat dau bang `is/has/can/should` (`isHydrated`, `isDisabled`). Ham bat dau bang dong tu (`formatDate`, `refreshAccessToken`). Khong viet tat kho doan (`usr`, `tmp`, `data2`).
2. **Ham nho, mot muc truu tuong.** Dung guard clause va return som thay cho `if` long nhau (toi da 2-3 cap). Hon 3 tham so thi gom thanh mot object.
3. **Khong magic value.** Mau, khoang cach, bo goc lay tu `@/constants/theme`. URL lay tu `Endpoints`, key tu `StorageKeys` va `queryKeys`. So co y nghia (timeout, gioi han, do dai) dat thanh hang so co ten.
4. **Dung lai truoc khi viet moi.** Xem bang "Thanh phan dung chung" trong `docs/ARCHITECTURE.md`, roi tim them trong `components/`, `hooks`, `utils`, `lib`. Chi tach abstraction khi logic lap lai lan thu ba, va khong gop hai doan chi giong nhau ve hinh thuc.
5. **Khong mutate, khong ternary long nhau.** Khong sua truc tiep props, state, tham so. Nhieu nhanh thi dung guard clause hoac lookup map.
6. **Khong nuot loi.** `catch` thi hoac xu ly co y nghia, hoac `logger.warn`/`logger.error` kem ngu canh roi nem lai hoac tra gia tri an toan co chu dich. UI hien `AppError.message`.
7. **`useEffect` chi de dong bo voi he thong ben ngoai.** Gia tri tinh duoc tu props/state thi tinh thang khi render. Du lieu server khong copy vao `useState` hay Zustand.
8. **Kieu chat.** Uu tien union literal hon `string`, suy kieu tu nguon (`z.infer`, `(typeof X)[keyof typeof X]`) thay vi khai bao lai.
9. **Comment giai thich "tai sao", khong ke lai code lam gi.** JSDoc mot dong cho export khong hien nhien. Khong de code bi comment-out, `console.log`, file thua.

## Quy trinh lam task

1. Doc code lien quan va tim thu co san de dung lai truoc khi viet.
2. Dat code dung tang (xem bang "Dat code o dau" trong [CONTRIBUTING.md](CONTRIBUTING.md)).
3. Them hoac sua test cho logic thuan (`utils`, `schemas`, ham xu ly du lieu), dat trong `src/__tests__/` hoac canh file duoc test.
4. Chay `npm run validate` va `npm run format:check`, bao ket qua that (kem output neu fail). Chua co `node_modules` thi `npm install` truoc.
5. Claude khong chay duoc app tren thiet bi. Voi thay doi UI, noi ro la chua kiem tra tren Android/iOS.
6. Hoi truoc khi: them thu vien, doi cau truc thu muc, sua `app.config.ts`, `eas.json`, `.github/`, hoac config ESLint/TypeScript/Prettier.
7. Chi commit khi duoc yeu cau. Theo Conventional Commits trong [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md), mo ta tieng Viet khong dau, header toi da 100 ky tu. Khong dung `--no-verify`.

## Tai lieu bat buoc (nap tu dong)

@docs/ARCHITECTURE.md

@docs/CODING_CONVENTIONS.md
