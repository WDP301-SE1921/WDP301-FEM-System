# Yêu cầu bổ sung/sửa BE cho mobile PHỤ HUYNH

Ngày: 06/10/2026. Phạm vi đối chiếu: nhánh `dev` của `WDP301-BE-System` tại commit `d4d3f3e` (đã merge PR #4 `feature/create-schedule` và PR #5 `feature/payment-bill`), các module `curriculum-scheduling`, `academic`, `registration-flow`, Prisma schema và `docs/SRS.md` (bản 03/10/2026). File này nằm ở repo mobile để gửi nhóm BE; mobile không sửa nguồn BE.

Mọi nhận xét dưới đây rút ra từ **đọc code**, chưa chạy lại trên một BE đang chạy. Mobile cũng chưa gọi thử BE thật cho các route mới nối (mới kiểm tra bằng typecheck, test với adapter mạng giả và bundle Android), nên nếu chỗ nào mobile hiểu sai contract thì nhờ BE báo lại.

## 0. Mobile đang dùng gì của BE

Đã nối thật từ 05/10: đăng nhập, đăng ký, refresh, đăng xuất, `GET /auth/me`, xác minh email, `GET/POST /me/students`, `PATCH /me/students/:id`, `GET /me/students/:id/enrollments`, `GET /registrations/:id/receipt`.

Nối thêm ngày 06/10 theo PR #4 và PR #5:

| Route                                                                              | Màn hình mobile                                                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `GET /academic/scheduled-sessions?fromDate&toDate&page&limit`                      | Lịch tuần, thẻ "Buổi học hôm nay", chi tiết buổi, buổi tiếp theo của từng môn, lộ trình môn |
| `GET /academic/leaves?studentId&kind=PERIOD_PAUSE&status=APPROVED&fromDate&toDate` | Trạng thái "Tạm nghỉ" của môn                                                               |
| `GET /academic/assignments?page&limit`                                             | Danh sách bài tập                                                                           |
| `GET /academic/assignments/:id`, `GET /academic/assignments/:id/submissions`       | Danh sách bài tập (ghép trạng thái nộp, điểm) và màn chi tiết bài                           |
| `POST /academic/submissions` (`recipientId`, `answers`)                            | Nộp bài                                                                                     |
| `GET /me/bills?page&limit`                                                         | Thẻ bill "Chưa thanh toán" của tab Học phí (bill `UNPAID` của con đang xem)                 |
| `GET /registrations/:id/bill`                                                      | Màn chi tiết bill, mở từ thẻ bill chưa thanh toán                                           |

Vẫn chạy bằng dữ liệu giả vì BE chưa có route cho phụ huynh: lịch sử điểm danh và tỷ lệ đi học, điểm trung bình và việc cần chú ý ở trang chủ, thông báo trong app.

## 1. Lỗi và điểm cần chốt trong code BE hiện tại

### 1.1 Buổi học bù của con không có trong lịch của phụ huynh (P0)

`CurriculumSchedulingService.sessions` với role `PARENT` chỉ lấy buổi của lớp con ghi danh (`enrollment.classId` hoặc `placements[].classId`). Khi nhân viên xếp học bù, con là `SessionParticipant` loại `MAKEUP` trong buổi của **lớp khác**, nên buổi đó không bao giờ được trả về. SRS mục 3.5 yêu cầu phụ huynh xem "lịch học bù". `GET /academic/makeups` có trả `replacement.session { id, classId, startsAt, endsAt }` nhưng không có tên lớp, môn, bài học và không ghép được vào lịch.

Đề xuất: `scheduled-sessions` trả thêm các buổi con tham gia với `kind: MAKEUP` (kèm buổi gốc được bù), mỗi buổi có một field phân biệt `REGULAR`/`MAKEUP`.

### 1.2 Ghi danh hết kỳ vẫn `ACTIVE`, còn ghi danh `ENDED` thì mất hết lịch sử buổi học (P0)

- Không có chỗ nào chuyển `Enrollment.status` sang `ENDED` khi qua `endDate` (chỉ `endOne` trong `enrollment-workflows.service.ts`, do nhân viên bấm). Vì vậy `status` không nói được con còn học hay không; BE tự so ngày ở từng nơi (`inTerm`, `scheduleOf`) và client cũng phải tự so. Mobile đang coi ghi danh `ACTIVE` đã qua `endDate` là "Đã kết thúc".
- Ngược lại, `scheduled-sessions` chỉ lấy ghi danh `status: 'ACTIVE'`. Ngay khi nhân viên kết thúc một ghi danh, mọi buổi đã học của ghi danh đó biến mất khỏi lịch và lộ trình của phụ huynh.

Đề xuất: trả trạng thái kỳ học đã tính sẵn (như `term.status` của biên lai) trong `GET /me/students/:id/enrollments`; và cho `scheduled-sessions` trả cả buổi trong kỳ của ghi danh `ENDED` (tới thời điểm kết thúc).

### 1.3 Buổi trong thời gian bảo lưu và buổi bị huỷ (P1, cần chốt)

- Buổi nằm trong đơn bảo lưu đã duyệt (`PERIOD_PAUSE`) vẫn được trả như buổi phải học. Cần chốt: ẩn, hay trả kèm cờ để app ghi "Đang bảo lưu".
- `SessionStatus.CANCELLED` có trong schema nhưng chưa route nào huỷ một buổi (nghỉ lễ, giáo viên nghỉ). Khi làm, lưu ý `scheduled-sessions` đang lọc bỏ buổi `CANCELLED` với `PARENT`: phụ huynh sẽ chỉ thấy buổi học biến mất. Đề xuất trả kèm `status: CANCELLED` để app hiện "Buổi học bị huỷ". Cũng lưu ý `findConflicts` bỏ qua buổi `CANCELLED` trong khi `class_sessions` có unique `(classId, startsAt)`, nên sinh lại lịch vào đúng giờ buổi đã huỷ sẽ vấp unique và trả 409 `RESOURCE_CONFLICT` thay vì `SCHEDULE_CONFLICT`.

### 1.4 Không báo nghỉ trước được cho buổi sinh từ học phần (P1, ảnh hưởng luồng của web)

`requestLeave` với `SINGLE_ABSENCE` yêu cầu đã có `SessionParticipant` của ghi danh trong buổi đó (`INVALID_SESSION`). Buổi sinh bằng `POST /academic/classes/:id/session-generations` không tạo danh sách điểm danh; chỉ `MANAGER`/`TEACHER` gọi được `POST /academic/sessions/:id/roster`. Hệ quả: phụ huynh báo nghỉ cho buổi tuần sau (SRS mục 6.4) thì nhân viên chưa ghi nhận được cho tới khi giáo viên chuẩn bị danh sách.

Đề xuất: khi ghi nhận nghỉ một buổi, tự tạo participant cho ghi danh đó nếu buổi thuộc kỳ và lớp của con; hoặc tạo roster ngay lúc sinh buổi và khi xác nhận thu tiền.

### 1.5 Phân trang không có tổng số bản ghi (P1)

Các route `academic` (`scheduled-sessions`, `assignments`, `submissions`, `leaves`, `makeups`) trả mảng trần, không có `total` hay `hasNextPage`, trong khi `GET /me/bills`, `GET /students`, `GET /registrations` trả `{ items, page, limit, total }`. Mobile phải đọc `limit=100` liên tiếp tới khi gặp trang chưa đầy. Riêng `scheduled-sessions` với `PARENT` còn tải toàn bộ buổi của khoảng ngày rồi mới cắt trang trong bộ nhớ (`.slice`), nên phân trang không giảm tải cho database.

Đề xuất: dùng chung một dạng `{ items, page, limit, total }` (web đã nêu ở mục 4.2 trong file yêu cầu của web) và báo trước khi đổi.

### 1.6 Thiếu phòng học trong schema (P2)

SRS mục 3.1 và 6.2 có bước chọn phòng khi tạo lớp, nhưng `Class` và `ClassSession` không có field phòng. Mobile đã ẩn dòng "Phòng học".

### 1.7 Ghi nhận thêm khi đọc PR #4 và PR #5 (không chặn mobile)

- Quyền đọc cùng một đơn đang kiểm tra theo hai cách: `GET /registrations/:id/bill` và `GET /me/bills` theo quan hệ `targetStudent.parentProfile.userId`, còn `GET /registrations/:id` và `GET /registrations/:id/receipt` theo `user.email === order.parentEmail`. Nên dùng một cách (theo quan hệ hồ sơ con) để bill đọc được thì biên lai cũng đọc được.
- Số tiền của bill là chuỗi thập phân (`pricing.total: "2400000.00"`, `payment.paidAmount`), còn biên lai trả number (`payment.amount`, `quotedAmount`). Mobile đang xử lý cả hai; nên thống nhất một dạng.
- `GET /me/bills` chưa lọc được theo `studentId` hay `status`. Mobile đọc hết các trang rồi tự lọc bill `UNPAID` của con đang xem.
- `GET /academic/sessions` (cũ, chỉ buổi đã có participant) và `GET /academic/scheduled-sessions` (mới) cùng tồn tại với kết quả khác nhau cho phụ huynh. Nên ghi rõ route nào là chính; mobile chỉ dùng route mới.
- `EnrollmentStatus.PENDING_LINK` vẫn còn trong schema dù SRS đã bỏ luồng link/mã (mục 5.3, 6.1).
- `GET /me/students/:id/enrollments` trả nguyên bản ghi Prisma (cả `registrationOrder`, `payment`, `class.monthlyFee`...). Contract đang là "mọi cột của bảng"; nên có DTO để đổi schema không làm vỡ client.
- Môi trường: `package.json` ghi `packageManager: pnpm@9.0.0` nhưng `pnpm-workspace.yaml` chỉ có `allowBuilds` (cấu hình của pnpm 10.26+), nên `pnpm install` qua corepack báo `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION`. `README.md` ghi Swagger ở `/docs`, `main.ts` đặt ở `/api/docs`.

## 2. API còn thiếu cho màn hình phụ huynh

Tên route dưới đây là **đề xuất**. Mobile chưa gọi route nào trong bảng này.

| Ưu tiên | Nhu cầu (SRS)                                                    | Hiện trạng BE                                                                                                                                                  | Đề xuất                                                                                                                                                                              |
| ------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0      | Kết quả điểm danh từng buổi và tỷ lệ đi học (3.5, 5.5, 5.6, 4.2) | `SessionParticipant.attendance` không được trả cho `PARENT` ở route nào. `GET /academic/sessions` chỉ cho biết con có trong buổi                               | `GET /me/students/:id/attendance?fromDate&toDate`: mỗi buổi kèm `attendance`, `kind`, đơn nghỉ, buổi học bù; kèm tỷ lệ đi học **tính ở BE** theo mục 5.5 để web và mobile giống nhau |
| P0      | Bài tập theo từng con                                            | `GET /academic/assignments` trả chung mọi con, chỉ có `id, classId, title, dueAt, status, maxAttempts`. Mobile phải gọi thêm đề bài và bài nộp: 1 + 2N request | Thêm lọc `studentId` (hoặc `GET /me/students/:id/assignments`), trả kèm tên lớp, môn, `recipientId`, số câu theo loại, tổng điểm, lần nộp gần nhất và điểm đã công bố                |
| P1      | Lịch theo từng con, có giáo viên                                 | `scheduled-sessions` không có id của con hay ghi danh; chỉ có `teacherId`. Mobile tự tách theo ghi danh và ẩn tên giáo viên                                    | Nhận `studentId`, hoặc trả `enrollmentId`/`studentProfileId` cho mỗi buổi; thêm `teacher { displayName }`, `lesson.sequence`                                                         |
| P1      | Chi tiết một buổi                                                | Không có route đọc một buổi cho `PARENT`. Mobile phải truyền kèm ngày học để tìm buổi trong lịch của ngày đó                                                   | `GET /academic/scheduled-sessions/:id` cho phụ huynh có con trong buổi, kèm điểm danh của con và `summary` của buổi                                                                  |
| P1      | Tiến độ học tập (3.5)                                            | `GET /academic/curriculum-units*` và `GET /academic/lessons` không cho `PARENT`. Mobile dựng lộ trình từ các buổi đã sinh nên không thấy bài chưa xếp buổi     | Cho phụ huynh đọc học phần đã duyệt của lớp con đang học (tiêu đề, thứ tự, loại bài), không cần `content`                                                                            |
| P1      | Lịch sử điểm, điểm trung bình (3.5)                              | Chỉ đọc được điểm qua từng bài nộp                                                                                                                             | Gộp vào route bài tập theo con ở trên, hoặc route tổng hợp điểm theo môn                                                                                                             |
| P2      | Tên giáo viên của lớp                                            | `GET /me/students/:id/enrollments` có `class.teacherId`, không có tên                                                                                          | Thêm `class.teacher { displayName }`                                                                                                                                                 |
| P2      | Tổng quan trang chủ                                              | Không có route tổng hợp                                                                                                                                        | Có thể ghép ở mobile khi đã có điểm danh và bài tập theo con; không bắt buộc thêm route                                                                                              |

Bài tự luận đính kèm ảnh: BE đã có `POST /academic/files` và `fileIds` trong `SubmissionDto`; phần còn thiếu nằm ở mobile.

Thông báo trong app: SRS chỉ có thông báo qua email (mục 3.11, 5.11). Mobile đang có nút chuông chạy bằng dữ liệu giả; giữ hay bỏ là việc nhóm chốt, chưa phải yêu cầu với BE.

## 3. Contract mobile đang dựa vào

Đổi các điểm sau cần báo mobile trước:

- `scheduled-sessions` (role `PARENT`): mảng buổi theo `startsAt` tăng dần; mỗi buổi có `id`, `classId`, `startsAt`, `endsAt` (UTC), `status`, `class.name`, `class.program.subject`, `lesson.title`, `lesson.kind` (`LESSON` | `MONTHLY_TEST`). Mobile gửi `fromDate`, `toDate` dạng `YYYY-MM-DD`, `page`, `limit=100`; khoảng dài nhất là một kỳ ghi danh (tối đa 12 tháng).
- Mobile tách buổi theo con bằng đúng điều kiện BE đang dùng: ghi danh `ACTIVE`, ngày học (giờ Việt Nam) trong `[startDate, endDate)`, và lớp khớp `placements` (`effectiveFrom <= startsAt < effectiveTo`) hoặc `class.id` khi không có placement. Vì vậy mobile cần `placements { classId, effectiveFrom, effectiveTo, class { id, name, program, weeklySchedules } }` trong `GET /me/students/:id/enrollments`.
- `leaves`: mobile đọc `enrollmentId`, `fromDate`, `toDate` của đơn `PERIOD_PAUSE` đã duyệt đang hiệu lực hôm nay.
- `me/bills`: `{ items, page, limit, total }`, mới lập trước; mỗi bill mobile đọc `registrationId`, `status` (`UNPAID` | `PAID` | `CANCELLED`), `issuedAt`, `student.id`, `class.name`, `term.packageMonths`, `term.startDate` (`YYYY-MM-DD`), `pricing.total`, `pricing.currency`.
- `assignments/:id`: `classId`, `title`, `instructions`, `dueAt`, `status`, `maxAttempts`, `recipients[] { id, enrollmentId }`, `questions[] { id, kind, prompt, choices, maxScore, correctAnswer? }`.
- `assignments/:id/submissions`: `recipientId`, `attemptNo`, `answers`, `submittedAt`, `grades[]` chỉ gồm bản `PUBLISHED`, bản sửa mới nhất trước (`totalScore`, `scores`, `feedback`, `publishedAt`).
- Mã lỗi mobile có thông báo tiếng Việt: `SUBMISSION_CLOSED`, `ATTEMPTS_EXHAUSTED`, `INVALID_ANSWERS`, `INVALID_CHOICE`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`.

## 4. Đề nghị để nghiệm thu chung

- Apply migration của PR #4 và PR #5 trên môi trường test và có dữ liệu: một tài khoản `PARENT` đã xác minh với hai con, mỗi con một ghi danh đang học ở lớp đã sinh buổi từ học phần (có bài kiểm tra tháng), một con có đơn bảo lưu đã duyệt, một buổi học bù đã xếp, một bài tập đang mở, một bài đã công bố điểm và một đơn đăng ký chưa xác nhận thu tiền (bill `UNPAID`).
- Cấu hình `SMTP_URL`, `MAIL_FROM` trên môi trường test: thiếu thì tài khoản phụ huynh tự đăng ký không nhận được mã xác minh và không tạo được hồ sơ con.
