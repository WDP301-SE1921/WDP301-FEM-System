# Huong dan dong gop

## Lan dau setup

```bash
npm install
cp .env.example .env
npm start
```

Neu `npm start` chay duoc va quet QR mo duoc app tren Expo Go thi setup xong.

## Lam mot task

```bash
git checkout develop && git pull origin develop
git checkout -b feature/<ma-issue>-<mo-ta-ngan>

# ... code ...

npm run validate
git add .
git commit -m "feat(<scope>): <mo ta>"
git push -u origin feature/<ma-issue>-<mo-ta-ngan>
```

Sau do mo PR vao `develop` tren GitHub va dien day du template.

Chi tiet quy uoc nhanh/commit: [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md).

## Dat code o dau

| Ban dang viet gi                           | Dat o dau                  |
| ------------------------------------------ | -------------------------- |
| Man hinh moi                               | `src/app/(tabs)/<ten>.tsx` |
| Logic nghiep vu, goi API, hook cua feature | `src/features/<ten>/`      |
| Nut/o nhap dung lai duoc o nhieu noi       | `src/components/ui/`       |
| Khoi giao dien dung chung (empty, error)   | `src/components/common/`   |
| Ham thuan tuy (format, tinh toan)          | `src/utils/`               |
| Mau sac, khoang cach, bo goc               | `src/constants/theme.ts`   |
| Duong dan API                              | `src/api/endpoints.ts`     |

Quy uoc chi tiet: [docs/CODING_CONVENTIONS.md](docs/CODING_CONVENTIONS.md).

## Checklist truoc khi mo PR

- [ ] `npm run validate` pass
- [ ] Da test tren thiet bi/may ao that, khong chi doc code
- [ ] Co anh chup man hinh neu co thay doi UI
- [ ] Khong con `console.log`, code nhap, file thua
- [ ] Khong hardcode mau/khoang cach
- [ ] Khong commit `.env` hay bat ky secret nao

## Review PR

Nguoi review can xem:

1. Code co dung dung tang khong (logic co lot vao `src/app/` khong).
2. Co xu ly du loading / error / empty khong.
3. Co hardcode mau, khoang cach, chuoi URL khong.
4. Ten bien va ten ham co ro nghia khong.
5. Co test cho phan logic thuan tuy khong.

Gop y cu the, kem vi du sua. Approve khi khong con van de chan.

## Bao loi hoac de xuat

Mo issue theo template san trong tab Issues (Bug / Feature / Task). Khong mo issue trong.
