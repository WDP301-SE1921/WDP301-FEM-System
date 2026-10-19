# Yêu cầu bổ sung/sửa BE cho mobile PHỤ HUYNH

Ngày: 19/10/2026. Phạm vi đối chiếu: nhánh `dev` của `WDP301-BE-System` tại commit `c3b54d4` (sau commit `9188c92` "add parent learning APIs and realtime notifications" và các commit back office ngày 19/10), các module `curriculum-scheduling`, `academic`, `registration-flow`, `auth`, `notifications`, Prisma schema, các tài liệu `docs/parent-learning-api.md`, `docs/notifications-api.md`, `NOTIFICATION_FLOW_GUIDE.md` và `docs/SRS.md` (bản 03/10/2026). Bản trước của file này đối chiếu commit `a02152c` (15/10). File nằm ở repo mobile để gửi nhóm BE; mobile không sửa nguồn BE.

Cảm ơn nhóm BE: gần hết yêu cầu của bản 15/10 đã có trong bản này (xem "Đã xử lý so với bản 15/10"). Mọi nhận xét dưới đây rút ra từ **đọc code**, chưa chạy lại trên một BE đang chạy: BE local của nhóm mobile chưa chạy các migration mới. Mobile cũng chưa gọi thử BE thật cho các route nối ngày 15/10 và 19/10 (mới kiểm tra bằng typecheck, test với adapter mạng giả và bundle Android), nên nếu chỗ nào mobile hiểu sai contract thì nhờ BE báo lại.

## 0. Mobile đang dùng gì của BE

Từ 19/10 mọi màn hình phụ huynh đều đọc BE thật, không còn dữ liệu giả.

Đã nối từ 05/10, 06/10 và 15/10: đăng nhập, đăng ký, refresh, đăng xuất, `GET` và `PATCH /auth/me`, xác minh email, đổi và quên mật khẩu, `GET/POST /me/students`, `PATCH /me/students/:id`, `GET /me/students/:id/enrollments`, `GET /me/bills`, `GET /registrations/:id/bill`, `GET /registrations/:id/receipt`, `GET /academic/scheduled-sessions`, `GET /academic/scheduled-sessions/:id`, `GET /academic/me/students/:id/attendance`, `GET /academic/leaves`, `GET /academic/makeups`, `GET /rooms`, `GET /academic/assignments`, `GET /academic/assignments/:id`, `GET /academic/assignments/:id/submissions`, `POST /academic/submissions`.

Nối thêm hoặc đổi cách gọi ngày 19/10:

| Route                                                                                                                    | Màn hình mobile                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `GET /academic/me/students/:id/grades?page&limit`                                                                        | Mới: "Điểm trung bình" ở trang chủ (trung bình mọi bài, chênh lệch so với tháng trước) và điểm trung bình môn trên thẻ môn học     |
| `GET /academic/me/students/:id/curriculum?page&limit`                                                                    | Mới: Lộ trình bài học (cả bài chưa xếp buổi); lớp chưa có học phần thì vẫn dựng từ các buổi                                        |
| `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/read-all` | Mới: nút chuông, màn "Thông báo", "Thông báo mới" ở trang chủ (lọc `studentId`)                                                    |
| Socket.IO namespace `/notifications`                                                                                     | Mới: `notification.created` thì tải lại thông báo và dữ liệu học tập đang hiện; `notifications.read-changed` thì tải lại thông báo |
| `GET /academic/scheduled-sessions?studentId&fromDate&toDate&paginated=true&page&limit`                                   | Đổi: gửi `paginated=true`, đọc theo `total`; hiện cả buổi `CANCELLED` kèm `cancelReason`; lấy giáo viên, phòng từ danh sách        |
| `GET /academic/scheduled-sessions/:id?studentId`                                                                         | Đổi: lấy tên phòng từ `room`, không gọi `GET /rooms` nữa                                                                           |
| `GET /academic/me/students/:id/attendance`                                                                               | Đổi: lớp, đơn nghỉ, lịch học bù lấy từ `history`; không gọi `GET /academic/makeups`, `GET /academic/leaves` nữa                    |
| `GET /academic/assignments?studentId&paginated=true&page&limit`                                                          | Đổi: lọc theo con, lấy lớp, số câu, lần nộp gần nhất và điểm đã công bố từ danh sách (trước đó 1 + 2N request)                     |
| `GET /academic/assignments/:id/submissions?paginated=true`, `GET /academic/leaves?…&paginated=true`                      | Đổi: đọc theo `total`                                                                                                              |
| `GET /me/students/:id/enrollments`                                                                                       | Đổi: tên giáo viên lấy từ `class.teacher` (và `placements[].class.teacher`)                                                        |
| `GET` và `PATCH /auth/me`                                                                                                | Đổi: màn "Thông tin tài khoản" điền sẵn số điện thoại từ `phone`; để trống thì gửi `phone: ""` để xoá số                           |

## 1. Lỗi và điểm cần chốt trong code BE hiện tại

### 1.1 Giáo trình chỉ trả cho ghi danh đang trong kỳ (P2)

`studentCurriculum` chỉ lấy ghi danh `ACTIVE` có `startDate <= hôm nay < endDate`. Ghi danh sắp học (đã thu tiền, kỳ chưa bắt đầu) nhận trang rỗng, nên mobile dựng lộ trình của môn đó từ các buổi đã sinh (không thấy bài chưa xếp buổi). Đề xuất: trả cả ghi danh `UPCOMING` (theo `term.status`), để phụ huynh xem trước nội dung kỳ sắp học.

### 1.2 Thẻ môn học vẫn cần `GET /rooms` (P2)

`GET /me/students/:id/enrollments` có `class.roomId` (cả trong `placements`) nhưng không có tên phòng, nên mobile vẫn gọi `GET /rooms` (trả mọi phòng của trung tâm, kèm `capacity`, `isActive`) chỉ để đổi id ra tên. Đề xuất: trả thêm `class.room { id, name } | null` như danh sách buổi học; khi đó mobile bỏ hẳn `GET /rooms`.

### 1.3 `lesson.sequence` vẫn đếm trong từng học phần (P2, còn từ bản trước)

Cả chi tiết buổi lẫn giáo trình ghi rõ `sequence` là thứ tự trong học phần. Mobile tự đánh số bài trên lộ trình (theo thứ tự học phần rồi thứ tự bài) và không hiện "Bài N" ở chi tiết buổi để khỏi lệch. Nếu có thứ tự trong cả khóa thì nhờ BE trả thêm.

### 1.4 `Enrollment.status` vẫn không tự sang `ENDED` (P2, còn từ bản trước)

Đã có `term.status` tính sẵn trong `GET /me/students/:id/enrollments` (cảm ơn). Mobile vẫn tự tính trạng thái kỳ học theo cùng quy tắc (`ENDED`, rồi hết hạn ở ngày `endDate`, rồi sắp học); không cần BE sửa thêm, chỉ ghi lại để hai bên giữ cùng quy tắc.

### 1.5 Không có thông báo khi app đóng (P2, cần chốt)

Bản này chỉ phát qua Socket.IO khi app đang mở; `NOTIFICATION_FLOW_GUIDE.md` ghi chưa có push hệ điều hành. Phụ huynh đóng app thì chỉ thấy thông báo khi mở lại. SRS chỉ yêu cầu email (mục 3.11, 5.11) nên đây không phải lỗi; nếu nhóm muốn báo ngay cả khi app đóng thì cần BE lưu push token của thiết bị (ví dụ Expo push) và mobile cần thêm thư viện, nên cần chốt chung.

### 1.6 Ghi nhận thêm (không chặn mobile)

- Socket bị BE đóng mỗi lần access token hết hạn, nên mobile refresh token rồi kết nối lại khoảng mỗi `expiresIn` giây. Mobile dùng chung một lần refresh cho REST và socket (BE xoay vòng refresh token). Nhờ BE xác nhận giới hạn bắt tay theo IP (`THROTTLE_LIMIT_PER_MINUTE`) đủ khi nhiều điện thoại cùng mạng LAN của trung tâm.
- Điện thoại không gửi header `Origin`, nên `CORS_ORIGINS` không ảnh hưởng mobile; proxy trên môi trường test phải chuyển tiếp WebSocket cho `/socket.io/`.
- Còn từ bản trước: quyền đọc bill (`targetStudent.parentProfile.userId`) và biên lai (`parentEmail`) kiểm tra theo hai cách khác nhau; số tiền của bill là chuỗi thập phân còn biên lai là number; `GET /me/bills` chưa lọc được theo con hay trạng thái (mobile đọc hết rồi lọc); `EnrollmentStatus.PENDING_LINK` vẫn còn dù SRS đã bỏ luồng link/mã; `GET /classes` cho role `PARENT` trả mọi lớp của trung tâm (kèm `monthlyFee`, `capacity`), mobile không dùng.

### Đã xử lý so với bản 15/10

- Chi tiết buổi của phụ huynh không còn trả `lesson.content` (giáo án có đáp án) và thông tin nội bộ của lớp (mục 1.1 cũ, P0).
- Danh sách buổi không còn trả buổi mà chỗ của con đã bị huỷ (mục 1.2 cũ).
- Danh sách buổi trả cả buổi `CANCELLED` kèm `cancelReason` (mục 1.3 cũ); mobile hiện nhãn "Đã huỷ" và lý do ở lịch tuần, thẻ "Buổi học hôm nay".
- Lịch sử điểm danh có lớp, đơn nghỉ đã duyệt và lịch học bù mới nhất (mục 1.4 cũ).
- `SafeUserDto` của phụ huynh có `phone` (mục 1.6 cũ).
- Phân trang có `total` khi gửi `paginated=true` (mục 1.7 cũ).
- Danh sách buổi có `room` và `teacher` (mục 1.8 cũ).
- Bài tập theo từng con kèm lớp, số câu, lần nộp gần nhất và điểm đã công bố; điểm trung bình theo môn; giáo trình cho phụ huynh; tên giáo viên của lớp trong ghi danh (mục 2 cũ: P0, hai dòng P1, P2).

## 2. API còn thiếu cho màn hình phụ huynh

Tên route dưới đây là **đề xuất**. Mobile chưa gọi route nào trong bảng này.

| Ưu tiên | Nhu cầu                                        | Hiện trạng BE                                             | Đề xuất                                                |
| ------- | ---------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| P2      | Tên phòng trên thẻ môn học                     | Ghi danh chỉ có `class.roomId`                            | Thêm `class.room { id, name }` (mục 1.2)               |
| P2      | Lộ trình của môn sắp học                       | Giáo trình chỉ trả cho ghi danh đang trong kỳ             | Trả cả ghi danh sắp học (mục 1.1)                      |
| P2      | Báo phụ huynh khi app đóng                     | Chỉ có Socket.IO khi app mở                               | Cần chốt chung (mục 1.5)                               |
| P2      | Giờ vào lớp, nhận xét riêng từng con, tài liệu | Chi tiết buổi chỉ có `summary` chung và điểm danh của con | Thêm vào `participation` và buổi học khi BE có dữ liệu |

Trang chủ không cần route tổng quan riêng: mobile đã ghép từ lịch học, điểm danh, điểm, bài tập, bill và thông báo.

Chưa làm ở mobile, chờ nhóm chốt (không phải yêu cầu với BE): phụ huynh gửi đơn xin nghỉ trên app (`POST /academic/leaves` đã cho `PARENT`; SRS mục 3.5 chưa ghi, mục 6.4 ghi "Phụ huynh báo nghỉ"), đính kèm ảnh bài tự luận (`POST /academic/files` đã có, mobile cần thêm thư viện chọn ảnh).

## 3. Contract mobile đang dựa vào

Đổi các điểm sau cần báo mobile trước:

- `scheduled-sessions` (role `PARENT`, có `studentId`, `paginated=true`): `{ items, page, limit, total }`, buổi theo `startsAt` tăng dần, gồm buổi `CANCELLED`; mỗi buổi có `id`, `classId`, `startsAt`, `endsAt` (UTC), `status`, `cancelReason`, `class.name`, `class.program.subject`, `teacher.displayName`, `room.name | null`, `lesson { id, title, kind }` (`LESSON` | `MONTHLY_TEST`), `participations[] { enrollmentId, kind, attendance }` (chỉ chỗ chưa huỷ). Mobile gửi `fromDate`, `toDate` dạng `YYYY-MM-DD`, `limit=100`; khoảng dài nhất là một kỳ ghi danh. Buổi chưa có participant thì mobile gán vào ghi danh theo `placements` (ghi danh `ACTIVE`, ngày học trong `[startDate, endDate)`, lớp khớp placement).
- `scheduled-sessions/:id?studentId` (role `PARENT`): `id`, `startsAt`, `endsAt`, `status`, `summary`, `cancelReason`, `class { name, program { subject } }`, `teacher { displayName }`, `room { name } | null`, `lesson { id, title }`, `participation { enrollmentId, kind, attendance } | null`. Mobile coi 404 `SESSION_NOT_FOUND` và 403 `FORBIDDEN` là "buổi không có trong lịch của con".
- `me/students/:id/attendance`: `counts { present, absent, madeUp, excused }` và `history[] { enrollmentId, effectiveStatus, session { id, startsAt, endsAt }, class { name, program { subject } }, approvedLeave { reason } | null, latestMakeup { status, replacement { session { startsAt } } } | null }`. Mobile không gửi `fromDate`, `toDate` và tính tỷ lệ = (`present` + `madeUp`) / (`present` + `madeUp` + `absent`), cùng công thức với BE.
- `me/students/:id/grades`: `subjects[] { subject, averageOutOf10 }`, `history[] { scoreOutOf10, publishedAt }`, `total`. Mobile đọc hết các trang (`limit=100`) để tính điểm trung bình mọi bài và chênh lệch so với điểm trung bình tính tới hết tháng trước.
- `me/students/:id/curriculum`: `{ items, total }`, mỗi học phần có `classes[] { id }`, `lessons[] { id, title, sequence, kind }`. Mobile khớp bài với buổi theo `lesson.id` của buổi.
- `assignments?studentId&paginated=true`: mỗi bài có `id`, `classId`, `testType`, `title`, `dueAt`, `maxAttempts`, `class { name, program { subject } }`, `questionCounts { multipleChoice, essay }`, `maxScore`, `recipients[] { studentId, latestSubmission { attemptNo, submittedAt, publishedGrade { totalScore, feedback, publishedAt } | null } | null }`.
- `assignments/:id`: `classId`, `title`, `instructions`, `dueAt`, `status`, `maxAttempts`, `recipients[] { id, enrollmentId }`, `questions[] { id, kind, prompt, choices, maxScore, correctAnswer? }`. `assignments/:id/submissions?paginated=true`: `recipientId`, `attemptNo`, `answers`, `submittedAt`, `grades[]` chỉ gồm bản `PUBLISHED`, bản sửa mới nhất trước.
- `leaves?paginated=true`: `enrollmentId`, `fromDate`, `toDate` của đơn `PERIOD_PAUSE` `APPROVED` (trạng thái tạm nghỉ của môn).
- `me/students/:id/enrollments`: `placements { classId, effectiveFrom, effectiveTo, class { id, name, roomId, program, weeklySchedules, teacher { displayName } | null } }`, `class` cùng dạng; `rooms`: `id`, `name`.
- `me/bills` (không gửi `paginated`): `{ items, page, limit, total }`, mới lập trước; mỗi bill mobile đọc `registrationId`, `status` (`UNPAID` | `PAID` | `CANCELLED`), `issuedAt`, `student.id`, `class.name`, `term`, `pricing.total`, `pricing.currency`.
- `notifications`: `{ items, page, limit, total }`, mỗi thông báo `id`, `type`, `title`, `body`, `target { kind, id }`, `context { studentIds }`, `createdAt`, `readAt`. Mobile mở bài tập (`ASSIGNMENT`) và buổi học (`SESSION`) theo `context.studentIds[0]`, bill theo `REGISTRATION`; loại khác chỉ đánh dấu đã đọc. `unread-count`: `{ unreadCount }`.
- Socket.IO: `io('<gốc server>/notifications', { path: '/socket.io', transports: ['websocket'], auth: { token } })`, sự kiện `notification.created` và `notifications.read-changed`, lỗi kết nối `AUTH_UNAUTHORIZED` (mobile refresh rồi kết nối lại một lần), `ORIGIN_NOT_ALLOWED` (dừng), các mã khác (thử lại chậm dần).
- `auth`: `GET /auth/me` và `PATCH /auth/me` trả `phone`; `PATCH /auth/me` body `{ displayName, phone }` với `phone: ""` là xoá số; `POST /auth/change-password` body `{ currentPassword, newPassword }` (8–72 ký tự), giữ phiên hiện tại; `POST /auth/forgot-password` body `{ email }`, trả 202 cả khi email chưa đăng ký.
- Mã lỗi mobile có thông báo tiếng Việt: `AUTH_CURRENT_PASSWORD_INVALID`, `SUBMISSION_CLOSED`, `ATTEMPTS_EXHAUSTED`, `INVALID_ANSWERS`, `INVALID_CHOICE`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`.

## 4. Đề nghị để nghiệm thu chung

- Môi trường test chạy đủ migration tới `c3b54d4` (gồm `20261019000000_assignment_metadata` và `20261019001000_notifications`) và có dữ liệu: một tài khoản `PARENT` đã xác minh với hai con; mỗi con một ghi danh đang học ở lớp đã sinh buổi từ học phần đã duyệt (có bài kiểm tra tháng) và đã có buổi chốt điểm danh; một buổi vắng có đơn nghỉ đã duyệt và lịch học bù ở lớp khác; một con có đơn tạm nghỉ đã duyệt; một con đã chuyển lớp; một buổi bị huỷ; một bài tập đang mở, một bài kiểm tra 15 phút đã công bố điểm và một đơn đăng ký chưa xác nhận thu tiền (bill `UNPAID`). Nhờ BE cho biết seed (`pnpm seed:dashboard`) tạo tài khoản phụ huynh nào phủ được các trường hợp trên.
- Để thử realtime: chạy một instance BE, cho điện thoại kết nối được tới cổng BE qua mạng LAN (không dùng `localhost`), rồi lần lượt công bố điểm, chốt điểm danh, huỷ một buổi, lập bill cho con của phụ huynh đó.
- Cấu hình `SMTP_URL`, `MAIL_FROM` và `WEB_ORIGIN` (địa chỉ điện thoại truy cập được) trên môi trường test: thiếu SMTP thì phụ huynh tự đăng ký không nhận được mã xác minh và link đặt lại mật khẩu.
