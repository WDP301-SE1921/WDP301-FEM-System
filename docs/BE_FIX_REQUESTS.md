# Yêu cầu bổ sung/sửa BE cho mobile PHỤ HUYNH

Ngày: 15/10/2026. Phạm vi đối chiếu: nhánh `dev` của `WDP301-BE-System` tại commit `a02152c` (sau PR #6, #7 `feature/curriculum`, PR #8 `feature/handoff` và các commit ngày 14/10), các module `curriculum-scheduling`, `academic`, `registration-flow`, `auth`, Prisma schema và `docs/SRS.md` (bản 03/10/2026). Bản trước của file này đối chiếu commit `d4d3f3e` (06/10). File nằm ở repo mobile để gửi nhóm BE; mobile không sửa nguồn BE.

Mọi nhận xét dưới đây rút ra từ **đọc code**, chưa chạy lại trên một BE đang chạy: BE local của nhóm mobile vẫn ở schema cũ, chưa chạy 10 migration mới. Mobile cũng chưa gọi thử BE thật cho các route nối ngày 15/10 (mới kiểm tra bằng typecheck, test với adapter mạng giả và bundle Android), nên nếu chỗ nào mobile hiểu sai contract thì nhờ BE báo lại.

## 0. Mobile đang dùng gì của BE

Đã nối từ 05/10 và 06/10: đăng nhập, đăng ký, refresh, đăng xuất, `GET /auth/me`, xác minh email, `GET/POST /me/students`, `PATCH /me/students/:id`, `GET /me/students/:id/enrollments`, `GET /me/bills`, `GET /registrations/:id/bill`, `GET /registrations/:id/receipt`, `GET /academic/scheduled-sessions`, `GET /academic/leaves`, `GET /academic/assignments`, `GET /academic/assignments/:id`, `GET /academic/assignments/:id/submissions`, `POST /academic/submissions`.

Nối thêm hoặc đổi cách gọi ngày 15/10:

| Route                                                                   | Màn hình mobile                                                                                                           |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `GET /academic/scheduled-sessions?studentId&fromDate&toDate&page&limit` | Đổi: gửi `studentId`, đọc `participations` để biết buổi học bù và bỏ buổi con đã mất chỗ                                  |
| `GET /academic/scheduled-sessions/:id?studentId`                        | Màn chi tiết buổi: giáo viên, phòng, ghi chú của giáo viên (`summary`), điểm danh của con                                 |
| `GET /academic/me/students/:id/attendance`                              | Tab Điểm danh (lịch sử, tỷ lệ đi học) và thẻ "Tỷ lệ đi học" ở trang chủ                                                   |
| `GET /academic/makeups?page&limit`                                      | Ghi chú "Lịch học bù", "Đã hoàn thành học bù" trên buổi vắng trong lịch sử điểm danh                                      |
| `GET /academic/leaves?studentId&status=APPROVED&page&limit`             | Lý do nghỉ trên buổi vắng, buổi nghỉ có phép trong lịch sử điểm danh                                                      |
| `GET /rooms`                                                            | Tên phòng ở chi tiết buổi và thẻ môn học                                                                                  |
| `PATCH /auth/me`                                                        | Màn "Thông tin tài khoản" (họ tên, số điện thoại)                                                                         |
| `POST /auth/change-password`                                            | Màn "Đổi mật khẩu"                                                                                                        |
| `POST /auth/forgot-password`                                            | Màn "Quên mật khẩu" (đặt lại mật khẩu làm trên trang web `/reset-password`, mobile không gọi `POST /auth/reset-password`) |

Bài tập đọc thêm `kind`, `testType` để hiện nhãn "Kiểm tra 15 phút", "Kiểm tra một tiết"... (cùng chữ với web).

Vẫn chạy bằng dữ liệu giả vì BE chưa có route cho phụ huynh: điểm trung bình, việc cần chú ý và thông báo gần đây ở trang chủ, số thông báo chưa đọc.

## 1. Lỗi và điểm cần chốt trong code BE hiện tại

### 1.1 Chi tiết buổi trả giáo án có đáp án cho phụ huynh (P0)

`CurriculumSchedulingService.sessionDetail` với role `PARENT` trả nguyên bản ghi `ClassSession` kèm `lesson.content`, `class` (cả `monthlyFee`, `capacity`, `teacherId`, `pendingTeacherId`...) và nguyên `program`. `lesson.content` là giáo án của thiết kế giáo trình; dữ liệu mẫu (`lessonContent` trong `src/database/seeds/curriculum-content.ts`) có cả mục "Hướng dẫn và đáp án". SRS mục 3.5 và 3.9 chỉ cho phụ huynh xem đáp án sau khi giáo viên công bố.

Mobile không hiển thị `lesson.content`, nhưng dữ liệu vẫn đi qua mạng tới máy phụ huynh. Đề xuất: với `PARENT`, `select` đúng các field cần (ví dụ `id`, `startsAt`, `endsAt`, `status`, `summary`, `cancelReason`, `class { name, program { subject } }`, `room { name }`, `teacher { displayName }`, `lesson { title, kind }`, `participation`), không trả `content`.

### 1.2 Lịch của phụ huynh vẫn có buổi mà chỗ của con đã bị huỷ (P1)

Trong `sessions()` (role `PARENT`), một buổi được giữ nếu con có `SessionParticipant` trong buổi (`participant || ...`), nhưng điều kiện này không loại participant `cancelled: true`. Hai trường hợp bị ảnh hưởng:

- Chuyển lớp: `transfer` huỷ participant thường ở các buổi tương lai của lớp cũ; lớp cũ không còn placement nhưng các buổi đó vẫn trả về vì còn participant đã huỷ.
- Huỷ học bù: participant `MAKEUP` ở buổi đích bị huỷ, buổi đó vẫn nằm trong lịch của con.

Mobile đang tự bỏ buổi có `participations` mà mọi phần tử đều `cancelled`. Đề xuất: thêm `cancelled: false` vào điều kiện participant, hoặc trả kèm cờ để client biết con không học buổi đó.

### 1.3 Buổi bị huỷ biến mất khỏi lịch (P1)

`POST /academic/sessions/:id/cancel` đã có, nhưng `scheduled-sessions` với `PARENT` vẫn lọc `status: { not: 'CANCELLED' }`, nên buổi bị huỷ chỉ biến mất khỏi lịch tuần. Chi tiết buổi (`GET /academic/scheduled-sessions/:id`) thì vẫn trả buổi `CANCELLED` kèm `cancelReason`, mobile hiện "Buổi học bị huỷ" và lý do. Đề xuất: danh sách cũng trả buổi `CANCELLED` (kèm `cancelReason`) trong khoảng ngày phụ huynh hỏi, để app báo cho phụ huynh thay vì im lặng.

### 1.4 Lịch sử điểm danh thiếu thông tin để hiển thị (P1)

`GET /academic/me/students/:id/attendance` đã đúng công thức SRS mục 5.5 (cảm ơn), nhưng mỗi phần tử `history` chỉ có `enrollmentId`, `attendance`, `effectiveStatus`, `session { id, classId, startsAt, endsAt }` và `sourceBookings` (chỉ booking `COMPLETED`, không có giờ buổi bù). Để hiện tên lớp, môn, lý do nghỉ và lịch học bù, mobile gọi thêm `GET /me/students/:id/enrollments`, `GET /academic/makeups` (đọc hết mọi trang, của mọi con) và `GET /academic/leaves`.

Đề xuất: mỗi phần tử `history` trả thêm `class { name, program { subject } }`, đơn nghỉ đã duyệt áp cho buổi (`kind`, `reason`) và booking học bù chưa huỷ mới nhất (`status`, `replacement.session.startsAt`). Ngoài ra `history` đang trả `enrollment.studentProfile { id, fullName }` và `id` của participant mà client không cần.

### 1.5 Ghi danh hết kỳ vẫn `ACTIVE` (P1, còn từ bản trước)

BE vẫn không tự chuyển `Enrollment.status` sang `ENDED` khi qua `endDate`, nên client phải tự so ngày (mobile coi ghi danh `ACTIVE` đã qua `endDate` là "Đã kết thúc"). Phần lịch sử của ghi danh `ENDED` thì đã trả trong `scheduled-sessions` từ bản này. Đề xuất như bản trước: trả trạng thái kỳ học đã tính sẵn (như `term.status` của biên lai) trong `GET /me/students/:id/enrollments`.

### 1.6 Tài khoản phụ huynh không đọc được số điện thoại của mình (P1)

`PATCH /auth/me` nhận `phone` nhưng `SafeUserDto` (cả `GET /auth/me` và response của `PATCH /auth/me`) không có `phone`; `BUSINESS_LOGIC_IMPLEMENTATION_STATUS.md` mục 4.3 cũng ghi nhận điều này. Mobile không hiện được số đang lưu, nên ô "Số điện thoại mới" để trống và chỉ gửi khi phụ huynh nhập số mới, vì gửi `phone: ""` sẽ xoá số đang lưu. Đề xuất: trả `phone` (của `ParentProfile`) trong `SafeUserDto` với role `PARENT`.

### 1.7 Phân trang không có tổng số bản ghi (P1, còn từ bản trước)

Các route `academic` (`scheduled-sessions`, `assignments`, `submissions`, `leaves`, `makeups`) vẫn trả mảng trần, không có `total`; `scheduled-sessions` với `PARENT` vẫn cắt trang trong bộ nhớ. Mobile đọc `limit=100` liên tiếp tới khi gặp trang chưa đầy. Đề xuất như bản trước: dùng chung `{ items, page, limit, total }` và báo trước khi đổi.

### 1.8 Ghi nhận thêm (không chặn mobile)

- `scheduled-sessions` (danh sách) không có phòng và tên giáo viên; chi tiết buổi có `teacher.displayName` và `roomId` nhưng không có tên phòng. Mobile gọi `GET /rooms` (trả mọi phòng, kèm `capacity`, `isActive`) để đổi `roomId` ra tên. Đề xuất trả `room { name }` và `teacher { displayName }` ở cả danh sách và chi tiết; khi đó mobile bỏ được `GET /rooms`.
- `lesson.sequence` đếm trong từng học phần (tháng), không phải thứ tự bài trong cả khóa, nên mobile không hiện "Bài N" ở chi tiết buổi để khỏi lệch với lộ trình. Nếu có thứ tự trong cả khóa thì nhờ BE trả thêm.
- `POST /auth/forgot-password` gửi link `WEB_ORIGIN/reset-password?token=...`. Phụ huynh mở link trên điện thoại, nên `WEB_ORIGIN` của môi trường test phải là địa chỉ điện thoại truy cập được (không phải `localhost`).
- `POST /auth/resend-verification` giờ luôn trả `{ sent: true }` cho phụ huynh chưa xác minh (email xếp vào outbox), kể cả khi SMTP chưa cấu hình. Mobile báo "Đã gửi lại mã" theo response này.
- `GET /classes` cho role `PARENT` trả mọi lớp của trung tâm (kèm `monthlyFee`, `capacity`, `rosterCount`); `studentId` chỉ lọc theo khối. Mobile không dùng route này; nhờ BE xác nhận đây là quyền mong muốn.
- Còn từ bản trước: quyền đọc bill (`targetStudent.parentProfile.userId`) và biên lai (`parentEmail`) kiểm tra theo hai cách khác nhau; số tiền của bill là chuỗi thập phân còn biên lai là number; `GET /me/bills` chưa lọc được theo con hay trạng thái; `EnrollmentStatus.PENDING_LINK` vẫn còn dù SRS đã bỏ luồng link/mã; `GET /me/students/:id/enrollments` trả nguyên bản ghi Prisma.

### Đã xử lý so với bản 06/10

- Buổi học bù ở lớp khác có trong `scheduled-sessions` qua `participations` (mục 1.1 cũ).
- Buổi của ghi danh đã kết thúc vẫn trả trong lịch tới thời điểm kết thúc (một nửa mục 1.2 cũ).
- Xin nghỉ một buổi tự tạo participant khi giáo viên chưa chuẩn bị danh sách (mục 1.4 cũ).
- Có phòng học (`Room`, `GET /rooms` cho phụ huynh) (mục 1.6 cũ).
- Có route điểm danh và tỷ lệ đi học cho phụ huynh, lịch theo từng con (`studentId`), chi tiết một buổi kèm giáo viên, ghi chú buổi và điểm danh của con (các dòng P0, P1 tương ứng ở mục 2 cũ).

## 2. API còn thiếu cho màn hình phụ huynh

Tên route dưới đây là **đề xuất**. Mobile chưa gọi route nào trong bảng này.

| Ưu tiên | Nhu cầu (SRS)                       | Hiện trạng BE                                                                                                                                              | Đề xuất                                                                                                                                                               |
| ------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0      | Bài tập theo từng con               | `GET /academic/assignments` trả chung mọi con, chỉ có `id, classId, kind, testType, session, title, dueAt, status, maxAttempts`. Mobile gọi 1 + 2N request | Thêm lọc `studentId` (hoặc `GET /me/students/:id/assignments`), trả kèm tên lớp, môn, `recipientId`, số câu theo loại, tổng điểm, lần nộp gần nhất và điểm đã công bố |
| P1      | Tiến độ học tập (3.5)               | `GET /academic/curriculum-units*` và `GET /academic/lessons` không cho `PARENT`. Mobile dựng lộ trình từ các buổi đã sinh nên không thấy bài chưa xếp buổi | Cho phụ huynh đọc học phần đã duyệt của lớp con đang học (tiêu đề, thứ tự, loại bài), không có `content`                                                              |
| P1      | Lịch sử điểm, điểm trung bình (3.5) | Chỉ đọc được điểm qua từng bài nộp                                                                                                                         | Gộp vào route bài tập theo con ở trên, hoặc route tổng hợp điểm theo môn                                                                                              |
| P2      | Tên giáo viên của lớp               | `GET /me/students/:id/enrollments` có `class.teacherId`, không có tên                                                                                      | Thêm `class.teacher { displayName }`                                                                                                                                  |
| P2      | Tổng quan trang chủ                 | Không có route tổng hợp                                                                                                                                    | Có thể ghép ở mobile khi đã có bài tập theo con; không bắt buộc thêm route                                                                                            |

Chưa làm ở mobile, chờ nhóm chốt (không phải yêu cầu với BE): phụ huynh gửi đơn xin nghỉ trên app (`POST /academic/leaves` đã cho `PARENT`; SRS mục 3.5 chưa ghi, mục 6.4 ghi "Phụ huynh báo nghỉ"), đính kèm ảnh bài tự luận (`POST /academic/files` đã có, mobile cần thêm thư viện chọn ảnh), thông báo trong app (`GET /academic/announcements`; SRS chỉ có thông báo qua email, mục 3.11, 5.11).

## 3. Contract mobile đang dựa vào

Đổi các điểm sau cần báo mobile trước:

- `scheduled-sessions` (role `PARENT`, có `studentId`): mảng buổi theo `startsAt` tăng dần; mỗi buổi có `id`, `classId`, `startsAt`, `endsAt` (UTC), `status`, `class.name`, `class.program.subject`, `lesson.title`, `lesson.kind` (`LESSON` | `MONTHLY_TEST`), `participations[] { enrollmentId, kind, attendance, cancelled }`. Mobile gửi `fromDate`, `toDate` dạng `YYYY-MM-DD`, `page`, `limit=100`; khoảng dài nhất là một kỳ ghi danh (tối đa 12 tháng). Buổi chưa có participant thì mobile gán vào ghi danh theo `placements` của `GET /me/students/:id/enrollments` (ghi danh `ACTIVE`, ngày học trong `[startDate, endDate)`, lớp khớp placement).
- `scheduled-sessions/:id?studentId` (role `PARENT`): `id`, `roomId`, `startsAt`, `endsAt`, `status`, `summary`, `cancelReason`, `class { name, roomId, program { subject } }`, `teacher { displayName }`, `lesson { title }`, `participation { enrollmentId, kind, attendance, cancelled } | null`. Mobile coi 404 `SESSION_NOT_FOUND` và 403 `FORBIDDEN` là "buổi không có trong lịch của con".
- `me/students/:id/attendance`: `counts { present, absent, madeUp, excused }` và `history[] { enrollmentId, effectiveStatus, session { id, classId, startsAt, endsAt } }`. Mobile không gửi `fromDate`, `toDate` (đọc từ trước tới nay) và tính tỷ lệ = (`present` + `madeUp`) / (`present` + `madeUp` + `absent`), cùng công thức với BE.
- `makeups`: `status`, `original { sessionId, enrollmentId }`, `replacement.session { id, startsAt }`, mới xếp trước.
- `leaves`: `enrollmentId`, `kind`, `sessionId`, `fromDate`, `toDate`, `reason`, `status`.
- `rooms`: `id`, `name`.
- `me/students/:id/enrollments`: `placements { classId, effectiveFrom, effectiveTo, class { id, name, roomId, program, weeklySchedules } }` và `class.roomId`.
- `me/bills`: `{ items, page, limit, total }`, mới lập trước; mỗi bill mobile đọc `registrationId`, `status` (`UNPAID` | `PAID` | `CANCELLED`), `issuedAt`, `student.id`, `class.name`, `term.packageMonths`, `term.startDate` (`YYYY-MM-DD`), `pricing.total`, `pricing.currency`.
- `assignments`, `assignments/:id`: thêm `kind` (`HOMEWORK` | `TEST`), `testType` (`FIFTEEN_MINUTES` | `ONE_PERIOD` | `MIDTERM` | `FINAL` | `null`); chi tiết bài như cũ: `classId`, `title`, `instructions`, `dueAt`, `status`, `maxAttempts`, `recipients[] { id, enrollmentId }`, `questions[] { id, kind, prompt, choices, maxScore, correctAnswer? }`.
- `assignments/:id/submissions`: `recipientId`, `attemptNo`, `answers`, `submittedAt`, `grades[]` chỉ gồm bản `PUBLISHED`, bản sửa mới nhất trước (`totalScore`, `scores`, `feedback`, `publishedAt`).
- `auth`: `PATCH /auth/me` body `{ displayName, phone? }` trả `SafeUserDto`; `POST /auth/change-password` body `{ currentPassword, newPassword }` (8–72 ký tự), giữ phiên hiện tại; `POST /auth/forgot-password` body `{ email }`, trả 202 cả khi email chưa đăng ký.
- Mã lỗi mobile có thông báo tiếng Việt: `AUTH_CURRENT_PASSWORD_INVALID`, `SUBMISSION_CLOSED`, `ATTEMPTS_EXHAUSTED`, `INVALID_ANSWERS`, `INVALID_CHOICE`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`.

## 4. Đề nghị để nghiệm thu chung

- Môi trường test chạy đủ migration tới `a02152c` và có dữ liệu: một tài khoản `PARENT` đã xác minh với hai con; mỗi con một ghi danh đang học ở lớp đã sinh buổi từ học phần (có bài kiểm tra tháng) và đã có buổi chốt điểm danh; một buổi vắng có đơn nghỉ đã duyệt và lịch học bù ở lớp khác; một con có đơn tạm nghỉ đã duyệt; một con đã chuyển lớp; một buổi bị huỷ; một bài tập đang mở, một bài kiểm tra 15 phút đã công bố điểm và một đơn đăng ký chưa xác nhận thu tiền (bill `UNPAID`). Seed demo mới (`src/database/seeds/`) có vẻ đã gần đủ; nhờ BE cho biết tài khoản phụ huynh nào phủ được các trường hợp trên.
- Cấu hình `SMTP_URL`, `MAIL_FROM` và `WEB_ORIGIN` (địa chỉ điện thoại truy cập được) trên môi trường test: thiếu SMTP thì phụ huynh tự đăng ký không nhận được mã xác minh và link đặt lại mật khẩu.
