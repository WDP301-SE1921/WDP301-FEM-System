# Quy trinh Git

## 1. Mo hinh nhanh (GitHub Flow + develop)

```
main       ->  code da release, luon chay duoc. Chi merge tu develop hoac hotfix.
develop    ->  nhanh tich hop. Moi feature merge vao day.
feature/*  ->  nhanh lam viec hang ngay.
fix/*      ->  sua bug thuong.
hotfix/*   ->  sua gap tren main, merge nguoc lai ca main va develop.
release/*  ->  chuan bi ban phat hanh (chi khi can freeze code).
```

**Khong ai push truc tiep vao `main` hay `develop`.** Moi thay doi di qua Pull Request.

## 2. Dat ten nhanh

```
<loai>/<ma-issue>-<mo-ta-ngan-gach-ngang>
```

Vi du:

```
feature/12-man-hinh-dang-nhap
fix/34-crash-khi-logout
hotfix/51-sai-url-api
chore/7-setup-ci
```

## 3. Quy uoc commit (Conventional Commits)

Commit bi chan boi `commitlint` neu sai dinh dang.

```
<type>(<scope>): <mo ta ngan, khong viet hoa dau dong, khong dau cham cuoi>
```

`type` hop le: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

Vi du dung:

```
feat(auth): them man hinh dang nhap
fix(api): xu ly 401 khi refresh token het han
chore(deps): nang expo len 57.0.22
```

Vi du sai:

```
update code            # thieu type
Feat: Them man hinh.   # sai hoa/cham cuoi
```

## 4. Vong doi mot task

```bash
# 1. Lay code moi nhat
git checkout develop
git pull origin develop

# 2. Tao nhanh
git checkout -b feature/12-man-hinh-dang-nhap

# 3. Code + commit (hook tu dong lint/format truoc khi commit)
git add .
git commit -m "feat(auth): them man hinh dang nhap"

# 4. Tu kiem tra truoc khi day len
npm run validate

# 5. Day len va mo PR vao develop
git push -u origin feature/12-man-hinh-dang-nhap
```

## 5. Luat Pull Request

- PR **nho**: duoi khoang 400 dong thay doi. PR to thi tach nho ra.
- Tieu de PR theo dung dinh dang commit: `feat(auth): them man hinh dang nhap`.
- Dien day du template PR, **bat buoc co anh chup man hinh voi moi thay doi UI**.
- Can it nhat **1 approve** va **CI xanh** truoc khi merge.
- Merge bang **Squash and merge** de lich su `develop` sach.
- Xoa nhanh sau khi merge.

## 6. Xu ly conflict

Dung `rebase` de giu lich su thang:

```bash
git checkout feature/12-man-hinh-dang-nhap
git fetch origin
git rebase origin/develop
# sua conflict -> git add <file> -> git rebase --continue
git push --force-with-lease
```

Luon dung `--force-with-lease`, **khong bao gio** dung `--force` tren nhanh chung.

## 7. Cai dat branch protection tren GitHub

Settings > Branches > Add rule cho `main` va `develop`:

- [x] Require a pull request before merging (1 approval)
- [x] Require status checks to pass: `Typecheck / Lint / Test`, `Bundle check (Metro)`
- [x] Require branches to be up to date before merging
- [x] Require conversation resolution before merging
- [x] Do not allow bypassing the above settings

## 8. Khi hook chan commit

| Thong bao                         | Nguyen nhan                  | Cach xu ly                        |
| --------------------------------- | ---------------------------- | --------------------------------- |
| `subject may not be empty`        | Commit message sai dinh dang | Viet lai theo muc 3               |
| `type must be one of [...]`       | Sai `type`                   | Dung dung 11 type o muc 3         |
| Loi ESLint khi commit             | Code vi pham quy uoc         | `npm run lint:fix` roi commit lai |
| `npm run typecheck` fail luc push | Loi TypeScript               | Sua het loi roi push lai          |

Chi bo qua hook khi that su khan cap, va phai sua ngay sau do:

```bash
git commit --no-verify -m "..."
```
