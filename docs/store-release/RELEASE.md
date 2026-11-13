# Phat hanh EduGrade len App Store va Google Play

Dung ngay 2026-11-12, lam theo cach du an VanGo dang phat hanh (`VanGo/fe-system/apps/mobile/RELEASE.md`). Ban dau tien: `1.0.0`.

| Muc                             | Gia tri                                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ten duoi icon                   | `EduGrade` (`app.config.ts`, variant `production`)                                                                                                                   |
| Ten tren store                  | `EduGrade - Phụ huynh` (`store.config.json`)                                                                                                                         |
| Bundle ID / package             | `com.wdp301.fem` (nguoi dung chot 2026-11-12, nop roi KHONG doi duoc)                                                                                                |
| EAS project                     | `@nhanle6/wdp301-fem-system`                                                                                                                                         |
| Tai khoan Apple                 | Dung chung team cua VanGo: Team ID `445T78T533`, cung App Store Connect API key                                                                                      |
| Phap nhan tren trang chinh sach | Cong ty TNHH Cong nghe Nadius, MST 0319699551, giong VanGo (nguoi dung chot 2026-11-12)                                                                              |
| Tai khoan Google Play           | Dung chung Play Console va service account cua VanGo                                                                                                                 |
| BE production                   | `EXPO_PUBLIC_API_URL` trong environment `production` cua EAS (tu 2026-11-13: `https://api.edugrade.45.77.168.110.sslip.io/api/v1`, BE tren VPS, HTTPS Let's Encrypt) |

Cac tep:

| Tep                                           | Dung cho                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `eas.json`                                    | Profile build `production` (AAB cho Android) va profile nop `internal`, `production`                    |
| `store.config.json`                           | Chu tren trang App Store, day bang `npm run metadata:push`                                              |
| `WDP301-FE-System/public/privacy.html`        | Chinh sach quyen rieng tu, ban duy nhat. Web EduGrade phuc vu o `/privacy.html`, chan trang chu co link |
| `WDP301-FE-System/public/delete-account.html` | Trang xoa tai khoan (Google Play bat buoc co URL). Web phuc vu o `/delete-account.html`                 |
| `docs/store-release/assets/`                  | Icon 512x512 va anh bia 1024x500 cho Google Play                                                        |
| `assets/expo.icon/Assets/edugrade-mark.svg`   | Logo goc (mu tot nghiep + sach mo). Icon, splash, anh store deu ve tu logo nay                          |

---

## 0. Viec CHAN, phai xong truoc khi gui duyet

| #   | Viec                                         | Vi sao                                                                                                                                                        | Trang thai 2026-11-12                                                                                                                                                                                                                                                                                                                                                                                |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Xoa tai khoan trong app**                  | Apple Guideline 5.1.1(v): app cho tu tao tai khoan thi phai cho xoa tai khoan ngay trong app. Google Play cung bat co duong xoa trong app va mot URL tren web | XONG 2026-11-13: BE `DELETE /auth/me` da co tren BE VPS (goi khong token tra 401), mobile man `delete-account` o tab Tai khoan da commit. Can co trong ban build gui duyet                                                                                                                                                                                                                           |
| 2   | **Icon va splash that**                      | Icon mau cua Expo de bi tu choi (2.3.8, 4.1)                                                                                                                  | XONG 2026-11-12: icon iOS (`assets/expo.icon`), `icon.png`, adaptive icon Android (nen, logo, ban don sac), splash nen `#2563EB`, favicon. Chua xem tren may that                                                                                                                                                                                                                                    |
| 3   | **Chinh sach quyen rieng tu dang cong khai** | Ca hai store bat buoc co URL mo duoc khong can dang nhap                                                                                                      | XONG 2026-11-13: hai trang tren web VPS tra 200, dung noi dung Nadius, mo khong can dang nhap (muc 1.5)                                                                                                                                                                                                                                                                                              |
| 4   | **BE production on dinh**                    | Nguoi duyet gap loi ngay man dang nhap la tu choi (2.1). Ban build chan `http://` nen BE phai co HTTPS                                                        | 2026-11-13: BE chuyen sang VPS, HTTPS chung chi Let's Encrypt het han 2027-02-11 (certbot tu gia han, kiem `certbot renew --dry-run` tren VPS). Realtime qua nginx tra 101                                                                                                                                                                                                                           |     |
| 5   | **Email gui duoc tu BE production**          | Nguoi duyet Apple hay thu dang ky tai khoan moi. Dang ky xong phai nhap ma xac minh gui qua email, chua xac minh thi khong them con duoc                      | XONG 2026-11-13: thu tren APK `preview` (emulator Android 13) voi BE VPS: dang ky, gui lai ma, nhap ma 6 so thanh cong, sau do tao duoc ho so con. Lan gui dau (16:03) khong toi, sau khi BE sua thi toi                                                                                                                                                                                             |
| 6   | **Tai khoan demo tren BE production**        | App bat dang nhap, nguoi duyet can tai khoan co san du lieu                                                                                                   | Chua xong. 2026-11-13: tai khoan PARENT cua seed tren BE production dang nhap duoc nhung chua co con, lop hay hoa don. Chieu cung ngay: da co 1 con, 1 lop (lich hoc chi toi 2026-11-13), 1 bai dang mo, chua co bai da cham, 1 hoa don; nguoi dung dien tai khoan nay vao muc Thong tin dang nhap cua Google Play. `seed-dashboard` tu choi chay o production nen phai tao du lieu tay. Xem muc 1.6 |

---

## 1. Chuan bi (lam mot lan)

### 1.1 May chay lenh

May nay da chay phat hanh VanGo nen thuong co san:

- `eas-cli` da dang nhap tai khoan `nhanle6` (`npx eas-cli whoami`).
- 3 bien moi truong cua App Store Connect API key (kiem ngay 2026-11-12: may nay co du, cung `EXPO_APPLE_TEAM_ID`, `EXPO_APPLE_TEAM_TYPE`): `EXPO_ASC_API_KEY_PATH`, `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID` (ca hai app dung chung key cua team). `eas.json` doc 3 bien nay khi `eas submit` iOS. Thieu bien thi eas-cli hoi tuong tac: tra loi **No** o cau "log in to your Apple account", dung nhap mat khau Apple ID (VanGo da bi Apple khoa tai khoan vi viec nay).
- Dong ho Windows dung gio. Nhanh hon Apple 1-2 giay la API key bi `401`. Sua: PowerShell **Run as Administrator**, `w32tm /resync /force`.

### 1.2 Tao app tren App Store Connect

1. <https://appstoreconnect.apple.com> -> **Apps** -> **+** -> **New App**.
2. Platform iOS, Name `EduGrade - Phụ huynh`, Primary Language **Vietnamese**, Bundle ID `com.wdp301.fem`, SKU tu dat (vd `edugrade-parent`), User Access: Full Access.
   - Chua thay bundle ID trong danh sach: dang ky tay tren <https://developer.apple.com/account/resources/identifiers/list> (dung team `445T78T533`, can quyen Account Holder hoac Admin): **+** -> App IDs -> App -> Description `EduGrade Parent` (Apple khong nhan dau `-` va chu co dau), Bundle ID **Explicit** `com.wdp301.fem`, khong tick capability nao (EAS tu dong bo capability luc build) -> Register, roi tai lai trang New App. Cach khac: chay buoc 3 (build iOS) truoc, `eas build` tu dang ky bundle ID nhung ton mot luot build.
3. Lay **Apple ID** cua app (so o App Information -> General Information) va them vao `eas.json` (XONG 2026-11-13: app da tao tren ASC, Apple ID `6834450551`):

   ```json
   "submit": { "production": { "ios": { "ascAppId": "<so do>", ... } } }
   ```

### 1.3 Tao app tren Google Play Console

1. Play Console cua VanGo -> **Create app**: ten `EduGrade - Phụ huynh`, ngon ngu mac dinh Tieng Viet, App, Free.
2. Nguoi dung xac nhan 2026-11-13: tai khoan Play la **to chuc**, khong bi luat duoi day, va chon phat hanh thang Production (bo qua internal/closed testing). Luat cu de tham khao: tai khoan Play **ca nhan** tao sau thang 11/2023 phai chay **closed testing voi it nhat 12 nguoi thu trong 14 ngay lien tuc** truoc khi duoc mo Production. Tai khoan to chuc thi khong. Day la moc dai nhat, khong rut ngan duoc: neu bi ap dung thi bat dau closed test som.
3. Service account cho `eas submit`: dung chung khoa cua VanGo. Da chep `VanGo/fe-system/apps/mobile/vangon-750bceec7af5.json` thanh `google-service-account.json` o goc repo mobile (gitignore, ngay 2026-11-12; may khac thi chep lai). Play Console -> **Users and permissions** -> service account do: neu chi duoc cap quyen theo tung app thi them app EduGrade (Release apps to testing tracks, Release to production, Manage store presence); neu co quyen cap tai khoan thi khong can lam gi.

### 1.4 Bien tren EAS

`EXPO_PUBLIC_API_URL` cua ban build nam tren EAS, khong doc tu `.env`:

```powershell
npx eas-cli env:list --environment production
```

Phai co `EXPO_PUBLIC_API_URL=https://.../api/v1` tro dung BE production. Doi thi `eas env:update`, khong sua `.env`.

### 1.5 Dang trang chinh sach

1. Noi dung da dien (Nadius, `support@vangon.vn`, `0559 294 401`, xu ly yeu cau xoa trong 7 ngay lam viec, xoa trong 30 ngay, giong VanGo). Trang xoa tai khoan mo ta dung `DELETE /auth/me` cua BE: xoa thong tin ca nhan cua phu huynh, giu ho so hoc tap cua con va chung tu hoc phi. BE doi cach xoa thi sua trang nay.
2. Hai trang nam trong web EduGrade (`WDP301-FE-System/public/`, nguoi dung chot 2026-11-12, chuyen tu `docs/store-release/` sang de chi con mot ban). Tu 2026-11-13 web chay tren VPS (`https://edugrade.45.77.168.110.sslip.io`, truoc do la Vercel), deploy bang workflow `.github/workflows/deploy.yml` cua repo web. Deploy web la co: `https://edugrade.45.77.168.110.sslip.io/privacy.html` va `https://edugrade.45.77.168.110.sslip.io/delete-account.html`. `proxy.ts` cua web chi chan `/login`, `/manager`, `/staff`, `/teacher` nen hai trang khong can dang nhap. Sua noi dung thi sua thang hai tep do.
3. Mo thu ca hai URL bang tab an danh.
4. Da dien vao `store.config.json` (2026-11-13): `privacyPolicyUrl` va `supportUrl` deu la `https://edugrade.45.77.168.110.sslip.io/privacy.html`. Support URL chua tro trang chu vi muc "Lien he trung tam" cua trang chu web dang la so lieu mau (0913 345 678, `lienhe@edugrade.vn`, So 1 Dai Co Viet), lech thong tin Nadius. Sua muc do thanh thong tin that thi doi `supportUrl` ve trang chu duoc.
5. Truoc khi nop: mo `https://edugrade.45.77.168.110.sslip.io/privacy.html` va `/delete-account.html` bang tab an danh, phai ra trang chu khong phai 404. Kiem lai chieu 2026-11-13: ca hai tra 200, dung noi dung (truoc do 404 vi workflow deploy web thieu secret dia chi VPS).

### 1.6 Tai khoan demo

Tao tren BE production, **khong commit vao dau** (chi go tay vao form cua store):

- Mot tai khoan `PARENT` cho Apple, mot tai khoan KHAC cho Google (dang nhap moi khong thu hoi phien cu, chi doi mat khau moi thu hoi; nhung nguoi duyet mot ben doi mat khau hoac xoa tai khoan thi ben kia mat tai khoan demo). Khong dung tai khoan dang bi test E2E chay tren production: 2026-11-13 tai khoan PARENT seed lien tuc nhan them con, lop, thong bao `E2E-PROD`.
- Email da xac minh, co it nhat 2 con, moi con da ghi danh it nhat mot lop co lich hoc trong tuan, co bai tap dang mo, bai da cham va da cong bo diem, co bill hoc phi.
- Du lieu la du lieu mau, khong dung ten that cua hoc sinh.
- Khong dung tai khoan PARENT cua seed: do la email ca nhan that, chua co du lieu, va mat khau la `SEED_DEFAULT_PASSWORD` dung chung voi moi tai khoan seed.
- Cach tao: dang ky trong app tro BE production (APK `preview` hoac Expo Go) bang email nhan duoc ma, vd Gmail them dau `+` (`<ten>+edugrade-apple@gmail.com`, `<ten>+edugrade-google@gmail.com`), nhap ma xac minh, them 2 con ten gia. Tren web: nhan vien ghi danh tung con vao lop co lich hoc trai qua nhieu tuan toi, giao vien giao 1 bai dang mo va cham, cong bo diem 1 bai khac, nhan vien tao hoa don cho tung con.

### 1.7 Doi mat khau tai khoan seed tren production

Kiem 2026-11-13: tai khoan PARENT cua seed dang nhap duoc bang `SEED_DEFAULT_PASSWORD`. Seed tao moi tai khoan (ADMIN, MANAGER, STAFF, TEACHER, CURRICULUM_DESIGNER, PARENT) bang cung mat khau do, email seed doan duoc (`<role>@edugrade.local`), web lai cong khai. Doi mat khau tat ca truoc khi app len store.

---

## 2. Kiem tai may truoc moi lan build

```powershell
cd C:\Users\Admin\Documents\GitHub\WDP301\WDP301-FEM-System
git status                 # dung commit se phat hanh, da push
npm run validate
npm run format:check
npm run doctor
npm run metadata:lint
```

Version nguoi dung thay: `version` trong `app.config.ts` va `apple.version` trong `store.config.json` phai trung nhau. So build (`buildNumber`, `versionCode`) EAS tu tang (`appVersionSource: remote`, `autoIncrement`).

## 3. Build iOS va tai len App Store Connect

```powershell
npx eas-cli build --platform ios --profile production --auto-submit-with-profile production
```

- Lan dau co the hoi tao Distribution Certificate va Provisioning Profile: chon de EAS quan ly. Team da co certificate cua VanGo thi chon dung lai.
- Build tren cloud cua EAS (chay tu Windows duoc), xong tu nop len ASC. Apple xu ly them 10-30 phut moi hien o TestFlight.
- Auto-submit hong thi nop lai: `npm run submit:ios -- --id <IOS_BUILD_ID>`.
- Moi lan build ton luot build cua tai khoan EAS.

## 4. Build Android va tai len Google Play

```powershell
npm run build:prod:android
```

- Ra tep **AAB**. Keystore cua `com.wdp301.fem` do EAS tao va giu (khac keystore cua ban `preview`).
- **Lan nop dau tien phai lam tay**: Google khong cho API tai len khi app chua co ban nao. Tai AAB tu trang build EAS -> Play Console -> **Testing -> Internal testing -> Create new release** -> tai AAB len. Bat **Play App Signing** khi Play hoi (mac dinh).
- Tu lan thu hai: `npm run submit:android -- --id <ANDROID_BUILD_ID>` (track `internal`). Bo `--id` thi CLI cho chon build.
- Thu tren may that tu link internal testing (ban do Play ky), dang nhap tai khoan demo, di het cac tab.

## 5. App Store Connect

1. `$env:APP_VARIANT = 'production'; npm run metadata:push` (PowerShell; xong thi dong terminal hoac `Remove-Item Env:APP_VARIANT`): ghi ten, phu de, mo ta, tu khoa, promo text, danh muc Education, chon phat hanh tay. `eas submit` KHONG ghi phan chu, phai chay lenh nay. Chay lai bao nhieu lan cung duoc truoc khi gui duyet.
2. **Build**: o phien ban 1.0.0 -> muc Build -> **+** -> chon build vua tai len.
3. **Screenshots**: chup tu tai khoan demo, it nhat bo iPhone 6.9" (ASC ghi ro kich thuoc can). Khong can iPad vi `supportsTablet: false`. Khong de du lieu hoc sinh that trong anh.
4. **App Privacy** -> Get Started -> **Yes, we collect data**. Tat ca "Linked to You", muc dich **App Functionality**, KHONG tracking:

   | Nhom         | Loai                                                                                    |
   | ------------ | --------------------------------------------------------------------------------------- |
   | Contact Info | Name, Email Address, Phone Number                                                       |
   | User Content | Photos or Videos (anh bai lam, anh dai dien), Other User Content (cau tra loi, tep PDF) |
   | Identifiers  | User ID                                                                                 |
   | Other Data   | Ngay sinh va lop cua con                                                                |

   Khong khai Diagnostics, Usage Data, Location, Purchases: app khong co SDK crash/analytics, khong lay vi tri, hoc phi chi hien du lieu trung tam lap chu khong gui tu may. Cau "Do you or your third-party partners use data for tracking?" -> **No**. Bam **Publish**.

5. **Age Rating**: tra loi khong co cho moi muc. Unrestricted Web Access: **No** (app chi mo link co dinh, khong co o nhap dia chi).
6. **App Review Information**: bat Sign-in required, go tay tai khoan demo cua Apple. Notes (tieng Anh):

   ```text
   EduGrade is the parent app of a tutoring centre (maths, physics, chemistry,
   biology for grades 6-9). Parents sign up with email, add their children,
   and the centre's staff enrol each child in a class at the centre. After
   that the parent sees the child's timetable, attendance, homework, grades
   and tuition bills. Children do and submit homework through the parent's
   signed-in session; there are no student accounts.

   DEMO ACCOUNT
   The demo parent account above already has children enrolled in classes,
   open homework, graded homework and tuition bills.

   PAYMENTS
   Tuition is paid in person at the centre for in-person classes. The app
   only shows bills and receipts created by the centre's staff. There is no
   purchase flow in the app.

   STAFF ACCOUNTS
   Teachers and centre staff use the EduGrade web app. If a staff account
   signs in on mobile, the app signs it out and shows a message.

   ACCOUNT DELETION
   Account tab ("Tài khoản") -> "Xóa tài khoản" -> enter the current
   password. The account is deleted immediately.
   ```

   Dong ACCOUNT DELETION chi giu khi muc 0.1 da xong (nut co trong ban build va BE production da co `DELETE /auth/me`).

7. **Version Release**: dang la phat hanh tay (`apple.release.automaticRelease: false`). **Add for Review** -> **Submit to App Review**. Duyet xong trang thai la `Pending Developer Release`: bam **Release This Version**, dung de treo (ASC chi cho mot phien ban chua phat hanh moi luc).

## 6. Google Play Console

Lam het muc **Policy -> App content** truoc khi gui duyet:

- **Privacy policy**: URL o muc 1.5.
- **App access**: All or some functionality is restricted -> them huong dan va tai khoan demo cua Google.
- **Ads**: No. **Advertising ID**: No (khong co SDK quang cao hay analytics; `expo-notifications` chi hien thong bao cuc bo, khong gui push token ve BE).
- **Government apps**: No. **Financial features**: app khong co tinh nang tai chinh (chi xem hoa don). **Health**: No. **News**: No.
- **Content rating**: bang hoi IARC, danh muc Education/Reference, tra loi khong cho moi noi dung nhay cam.
- **Target audience and content**: **can nguoi dung chot**. Tai khoan la cua phu huynh (18+), nhung hoc sinh lop 6-9 (11-15 tuoi) dung app qua phien cua phu huynh. Chon them nhom duoi 13 tuoi thi app phai theo **Families Policy** cua Google (app khong co quang cao, khong SDK theo doi nen kha thi, nhung duyet ky hon). Chi chon 18+ thi phai the hien dung la app cho phu huynh, va van co rui ro Google danh gia khac.
- **Data safety**: thu thap **Yes**, chia se **No** (nha cung cap ha tang khong tinh la chia se), ma hoa khi truyen **Yes**, cho yeu cau xoa **Yes** (URL `https://edugrade.45.77.168.110.sslip.io/delete-account.html`).

  | Loai du lieu                                                       | Bat buoc | Muc dich                              |
  | ------------------------------------------------------------------ | -------- | ------------------------------------- |
  | Personal info -> Name                                              | Bat buoc | App functionality, Account management |
  | Personal info -> Email address                                     | Bat buoc | App functionality, Account management |
  | Personal info -> Phone number                                      | Tuy chon | App functionality, Account management |
  | Personal info -> User IDs                                          | Bat buoc | App functionality, Account management |
  | Personal info -> Other info (ngay sinh, lop cua con)               | Bat buoc | App functionality                     |
  | Photos and videos -> Photos                                        | Tuy chon | App functionality                     |
  | Files and docs                                                     | Tuy chon | App functionality                     |
  | App activity -> Other user-generated content (cau tra loi bai tap) | Bat buoc | App functionality                     |

  Khong khai Location, Financial info, App interactions, Crash logs, Device IDs.

- **Main store listing**:
  - App name: `EduGrade - Phụ huynh`
  - Short description (toi da 80 ky tu): `Lịch học, điểm danh, bài tập, điểm và học phí của con tại trung tâm`
  - Full description: dung nguyen van `description` trong `store.config.json`.
  - Icon 512x512 (`assets/play-store-icon-512.png`), feature graphic 1024x500 (`assets/play-feature-graphic.png`), it nhat 2 anh chup dien thoai.
  - Email lien he cong khai: email ho tro o muc 1.5.
  - Category: Education.

Ban 1.0.0 (2026-11-13): nguoi dung phat hanh thang **Production** (tai khoan to chuc): Production -> Countries/regions them Viet Nam -> Create new release -> tai AAB -> Publishing overview -> Send for review. Cach cham hon: Internal testing chay on -> (neu bi ap luat 12 nguoi) Closed testing 14 ngay -> **Promote release -> Production**, ty le phat hanh 20% roi tang dan -> **Publishing overview -> Send for review**.

## 7. Cac ban sau

- Doi native (them thu vien co ma native, doi quyen, icon, splash, `app.config.ts`): nang `version` trong `app.config.ts` va `apple.version` trong `store.config.json`, build va nop lai ca hai store.
- Chi sua JS van phai build va nop lai: app chua co OTA (`expo-updates` chua cai). Muon va loi khong qua duyet nhu VanGo (`VanGo/document/store-release/ota-eas-update.md`) thi phai them thu vien do (hoi truoc) va nop mot ban moi co no.
- Ban phat hanh tren store dung BE production: doi contract BE lam vo app cu thi phai giu tuong thich cho toi khi nguoi dung cap nhat xong.

## 8. Su co thuong gap

| Trieu chung                                                                                  | Nguyen nhan                                                                                                                                                                                                 | Xu ly                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Apple 401 ... Authentication credentials are missing or invalid`, roi hoi mat khau Apple ID | Dong ho may nhanh hon Apple                                                                                                                                                                                 | `w32tm /resync /force` (Administrator). Khong nhap mat khau Apple ID                                                                                                                     |
| `eas submit` iOS hoi tuong tac                                                               | Thieu 3 bien `EXPO_ASC_*` hoac thieu `ascAppId`                                                                                                                                                             | Muc 1.1, 1.2. Bien dat bang `setx` chi co hieu luc sau khi tat han roi mo lai VS Code                                                                                                    |
| `eas build` iOS hoi `Would you like to set up Push Notifications for your project?`          | App chi hien thong bao cuc bo, khong can khoa APNs. Chon Yes thi eas-cli doi dang nhap Apple ID (API key khong tao duoc khoa APNs)                                                                          | Tra loi **No**. Lo chon Yes: Ctrl+C, KHONG nhap mat khau Apple ID, chay lai lenh build                                                                                                   |
| `metadata:push` bao `Failed to load app "com.wdp301.fem.dev"`                                | Thieu `APP_VARIANT=production`: `eas metadata` doc `app.config.ts` ma khong nhan `env` cua build profile, variant mac dinh la `development`                                                                 | Chay nhu muc 5.1                                                                                                                                                                         |
| ASC tao san phien ban `1.0`, build va `store.config.json` la `1.0.0`                         | ASC tu dat `1.0` khi tao app                                                                                                                                                                                | Trang phien ban tren ASC -> o Version doi thanh `1.0.0` -> Save, truoc khi `metadata:push`                                                                                               |
| `metadata:push` bao thieu `versionString`                                                    | Thieu `apple.version` hoac lech `version` trong `app.config.ts`                                                                                                                                             | Dong bo hai cho                                                                                                                                                                          |
| Build khong chon duoc o muc Build cua ASC                                                    | Apple chua xu ly xong, hoac version lech                                                                                                                                                                    | Doi 30 phut, kiem version                                                                                                                                                                |
| Play bao `APK hoac Android App Bundle can co ten goi com.wdp301.fem.dev`                     | Form tao app cua Play khong co o ten goi: Play khoa app vao ten goi cua tep tai len DAU TIEN. 2026-11-13 tep dau tien la ban `.dev` (khong phai tu EAS: AAB production cua EAS da kiem la `com.wdp301.fem`) | Khong sua duoc app do. Tao app moi, khai lai App content va trang store, chi tai AAB tu `npm run build:prod:android`. App cu chua phat hanh thi xoa duoc o Thiet lap -> Cai dat nang cao |
| `eas submit` Android bao app chua co ban nao                                                 | Lan dau phai tai tay                                                                                                                                                                                        | Muc 4                                                                                                                                                                                    |
| Nguoi duyet bao app khong tai duoc du lieu                                                   | BE VPS dang tat hoac loi, hoac tai khoan demo het du lieu                                                                                                                                                   | Muc 0.4, 1.6                                                                                                                                                                             |

Tai lieu Expo: [EAS Submit](https://docs.expo.dev/submit/introduction/), [iOS](https://docs.expo.dev/submit/ios/), [Android](https://docs.expo.dev/submit/android/), [EAS Metadata](https://docs.expo.dev/eas/metadata/).
