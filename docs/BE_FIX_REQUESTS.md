# Yêu cầu bổ sung/sửa BE cho mobile PHỤ HUYNH

Ngày: 19/10/2026, bổ sung mục 1.7 ngày 20/10/2026 sau khi rà soát độ dễ dùng của app với phụ huynh và học sinh, mục 1.8 ngày 27/10/2026 sau đợt CLO và phân trang của BE (`c9ecbcd`), mục 1.9 ngày 03/11/2026 sau đợt chấm bài bằng AI và CLO (`0289bbf`); cùng ngày nhóm mobile sửa thẳng trong bản checkout BE các mục 1.1, 1.2, 1.7.1, 1.7.2, 1.7.3, 1.8.2, 1.8.3, 1.9 và 1.10 (ghi "_Bản sửa 03/11_" ở từng mục, chưa commit, chờ BE review, merge và deploy). Phạm vi đối chiếu: nhánh `dev` của `WDP301-BE-System` tại commit `c3b54d4` (sau commit `9188c92` "add parent learning APIs and realtime notifications" và các commit back office ngày 19/10), các module `curriculum-scheduling`, `academic`, `registration-flow`, `auth`, `notifications`, Prisma schema, các tài liệu `docs/parent-learning-api.md`, `docs/notifications-api.md`, `NOTIFICATION_FLOW_GUIDE.md` và `docs/SRS.md` (bản 03/10/2026). Bản trước của file này đối chiếu commit `a02152c` (15/10). File nằm ở repo mobile để gửi nhóm BE; mobile không sửa nguồn BE.

Cảm ơn nhóm BE: gần hết yêu cầu của bản 15/10 đã có trong bản này (xem "Đã xử lý so với bản 15/10"). Mọi nhận xét dưới đây rút ra từ **đọc code**, chưa chạy lại trên một BE đang chạy: BE local của nhóm mobile chưa chạy các migration mới. Mobile cũng chưa gọi thử BE thật cho các route nối ngày 15/10 và 19/10 (mới kiểm tra bằng typecheck, test với adapter mạng giả và bundle Android), nên nếu chỗ nào mobile hiểu sai contract thì nhờ BE báo lại.

## 0. Mobile đang dùng gì của BE

Từ 19/10 mọi màn hình phụ huynh đều đọc BE thật, không còn dữ liệu giả.

Đã nối từ 05/10, 06/10 và 15/10: đăng nhập, đăng ký, refresh, đăng xuất, `GET` và `PATCH /auth/me`, xác minh email, đổi và quên mật khẩu, `GET/POST /me/students`, `PATCH /me/students/:id`, `GET /me/students/:id/enrollments`, `GET /me/bills`, `GET /registrations/:id/bill`, `GET /registrations/:id/receipt`, `GET /academic/scheduled-sessions`, `GET /academic/scheduled-sessions/:id`, `GET /academic/me/students/:id/attendance`, `GET /academic/leaves`, `GET /academic/makeups`, `GET /rooms`, `GET /academic/assignments`, `GET /academic/assignments/:id`, `GET /academic/assignments/:id/submissions`, `POST /academic/submissions`. Nối ngày 21/10: `POST /academic/files` (ảnh bài làm JPEG hoặc PNG, gửi kèm bài nộp qua `fileIds`). Nối ngày 27/10: `GET /academic/programs/:id/outcome-sets` (khối "Mục tiêu khóa học" ở Lộ trình); cùng ngày mobile đọc thêm `learningTargets`, `questions[].outcomeId` của chi tiết bài (khối "Mục tiêu bài") và đọc hết các trang của `GET /me/students`, `GET /me/students/:id/enrollments`, `GET /rooms`, `history` điểm danh. Nối ngày 28/10: `GET /academic/files/:id/preview` (xem lại ảnh bài làm đã nộp), `GET`, `PUT`, `DELETE /auth/me/avatar` (ảnh đại diện của phụ huynh). Nối ngày 03/11: `GET /academic/outcome-sets/:id` (ghi chú mục tiêu không bắt buộc ở khối "Mục tiêu bài", mục 1.9.2).

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

_Bản sửa 03/11 (chờ BE review, merge và deploy):_ `studentCurriculum` lấy cả ghi danh `ACTIVE` chưa bắt đầu; lớp của kỳ sắp học là lần xếp lớp có hiệu lực lúc kỳ bắt đầu (không có lần xếp lớp nào thì lớp lúc đăng ký). Mobile không cần sửa: lộ trình tự dùng học phần khi BE trả.

### 1.2 Thẻ môn học vẫn cần `GET /rooms` (P2)

`GET /me/students/:id/enrollments` có `class.roomId` (cả trong `placements`) nhưng không có tên phòng, nên mobile vẫn gọi `GET /rooms` (trả mọi phòng của trung tâm, kèm `capacity`, `isActive`) chỉ để đổi id ra tên. Đề xuất: trả thêm `class.room { id, name } | null` như danh sách buổi học; khi đó mobile bỏ hẳn `GET /rooms`.

_Bản sửa 03/11 (chờ BE review, merge và deploy):_ `GET /me/students/:id/enrollments` (và route của nhân viên dùng chung hàm) trả thêm `class.room { id, name } | null`, cả trong `placements`. Mobile đọc `room` khi có và chỉ gọi `GET /rooms` khi BE chưa trả field này (BE trên Render hiện tại).

### 1.3 `lesson.sequence` vẫn đếm trong từng học phần (P2, còn từ bản trước)

Cả chi tiết buổi lẫn giáo trình ghi rõ `sequence` là thứ tự trong học phần. Mobile tự đánh số bài trên lộ trình (theo thứ tự học phần rồi thứ tự bài) và không hiện "Bài N" ở chi tiết buổi để khỏi lệch. Nếu có thứ tự trong cả khóa thì nhờ BE trả thêm.

_Đã xử lý ở mobile (03/11), không cần BE sửa:_ chi tiết buổi hiện "Bài N" lấy từ lộ trình của môn (cùng số phụ huynh thấy ở Lộ trình, theo bài của buổi hoặc theo buổi khi lộ trình ghép từ các buổi). Số "trong cả khóa" ở BE khó định nghĩa: học phần của một khóa nối nhau qua nhiều kỳ, phiên bản mới có thể chép lại bài của phiên bản cũ, nên số đếm cả khóa sẽ lệch với lộ trình theo kỳ mà phụ huynh đang xem.

### 1.4 `Enrollment.status` vẫn không tự sang `ENDED` (P2, còn từ bản trước)

Đã có `term.status` tính sẵn trong `GET /me/students/:id/enrollments` (cảm ơn). Mobile vẫn tự tính trạng thái kỳ học theo cùng quy tắc (`ENDED`, rồi hết hạn ở ngày `endDate`, rồi sắp học); không cần BE sửa thêm, chỉ ghi lại để hai bên giữ cùng quy tắc.

### 1.5 Không có thông báo khi app đóng (P2, cần chốt)

Bản này chỉ phát qua Socket.IO khi app đang mở; `NOTIFICATION_FLOW_GUIDE.md` ghi chưa có push hệ điều hành. Phụ huynh đóng app thì chỉ thấy thông báo khi mở lại. SRS chỉ yêu cầu email (mục 3.11, 5.11) nên đây không phải lỗi; nếu nhóm muốn báo ngay cả khi app đóng thì cần BE lưu push token của thiết bị (ví dụ Expo push) và mobile cần thêm thư viện, nên cần chốt chung.

### 1.6 Ghi nhận thêm (không chặn mobile)

- Socket bị BE đóng mỗi lần access token hết hạn, nên mobile refresh token rồi kết nối lại khoảng mỗi `expiresIn` giây. Mobile dùng chung một lần refresh cho REST và socket (BE xoay vòng refresh token). Nhờ BE xác nhận giới hạn bắt tay theo IP (`THROTTLE_LIMIT_PER_MINUTE`) đủ khi nhiều điện thoại cùng mạng LAN của trung tâm.
- Proxy trên môi trường test phải chuyển tiếp WebSocket cho `/socket.io/`. (Bản trước ghi điện thoại không gửi header `Origin`: sai, xem mục 1.10.)
- Còn từ bản trước: quyền đọc bill (`targetStudent.parentProfile.userId`) và biên lai (`parentEmail`) kiểm tra theo hai cách khác nhau; số tiền của bill là chuỗi thập phân còn biên lai là number; `GET /me/bills` chưa lọc được theo con hay trạng thái (mobile đọc hết rồi lọc); `EnrollmentStatus.PENDING_LINK` vẫn còn dù SRS đã bỏ luồng link/mã; `GET /classes` cho role `PARENT` trả mọi lớp của trung tâm (kèm `monthlyFee`, `capacity`), mobile không dùng.

### 1.7 Chỗ khó dùng với phụ huynh ít quen công nghệ (bổ sung 20/10)

Ba mục dưới đây rút ra từ đọc code BE `c3b54d4`, chưa thử trên BE đang chạy. Mobile đã làm phần của mình (ghi ở từng mục); phần còn lại cần BE.

**1.7.1 Xác minh email phải dán mã 43 ký tự (P1).** `issueEmailVerification` (`auth.service.ts`) gửi email chỉ có dòng `Mã xác minh tài khoản EduGrade: <mã>`, mã là 32 byte dạng base64url. Phụ huynh phải mở app email, nhấn giữ để chép cả chuỗi dài, quay lại app rồi dán: đây là chỗ người ít dùng điện thoại dễ bỏ cuộc nhất, và xác minh xong mới tạo được hồ sơ con. Mobile đã tự lấy mã khi phụ huynh dán cả dòng (trước đó dán cả dòng thì BE báo `AUTH_INVALID_EMAIL_TOKEN`). Đề xuất, chọn một:

- Email có link bấm được, ví dụ `fem://verify-email?token=<mã>` (scheme theo bản cài: `fem`, `fempreview`, `femdev`) hoặc link web chuyển tiếp về app. Mobile sẽ thêm xử lý link khi BE chốt dạng link.
- Hoặc mã 6 chữ số, hạn ngắn (ví dụ 15 phút), giới hạn số lần nhập sai: phụ huynh đọc và gõ được, không cần chép dán.

Web không gọi `POST /auth/verify-email` nên không bị ảnh hưởng; giữ được dạng mã cũ song song nếu cần.

_Bản sửa 03/11 (chờ BE review, merge và deploy; người dùng chọn mã 6 số):_ email gửi mã 6 chữ số (chỉ trong nội dung email, vì tiêu đề hiện trong nhật ký gửi email của quản lý), hạn 15 phút; `POST /auth/verify-email` nhận `{ email, code }`. Chỉ mã mới nhất của tài khoản dùng được, nhập sai 5 lần thì mã hết hiệu lực (400 `AUTH_EMAIL_CODE_ATTEMPTS_EXCEEDED`), mỗi tài khoản tối đa 5 mã mỗi giờ (429 `AUTH_VERIFICATION_RATE_LIMITED`). Có migration mới `20261103000000_email_verification_code_attempts` (cột `failedAttempts`). `{ token }` của email cũ vẫn được nhận. Mobile đã đổi màn xác minh thành ô nhập 6 số (bàn phím số, gợi ý mã từ email/thông báo), **chỉ chạy với BE đã có bản sửa**: BE cũ trên Render từ chối `{ email, code }` (400) và vẫn gửi mã dài.

**1.7.2 Tuần nào phụ huynh cũng phải đăng nhập lại (P1).** `createAuthenticatedSession` đặt `expiresAt` của phiên bằng lúc đăng nhập cộng `JWT_REFRESH_TTL_SECONDS` (mặc định 604800, tức 7 ngày), còn `refresh` ký cặp token mới với `session.expiresAt` cũ. Vì vậy dù mở app mỗi ngày, phiên vẫn hết đúng 7 ngày sau lần đăng nhập. Phụ huynh hay quên mật khẩu sẽ bị chặn mỗi tuần. Mobile đã báo "Phiên đăng nhập đã hết hạn" ở màn đăng nhập thay vì đưa về màn chào mà không giải thích. Đề xuất: mỗi lần refresh thì gia hạn phiên thêm một chu kỳ (`expiresAt = now + TTL`), kèm một hạn tuyệt đối dài (ví dụ 90 ngày) và vẫn thu hồi khi đổi mật khẩu hoặc dùng lại refresh token cũ. Web dùng chung luồng auth nên cũng đỡ phải đăng nhập lại.

_Bản sửa 03/11 (chờ BE review, merge và deploy):_ mỗi lần refresh gia hạn phiên thêm `JWT_REFRESH_TTL_SECONDS` (mặc định 7 ngày), không quá `JWT_SESSION_MAX_AGE_SECONDS` (biến mới, mặc định 90 ngày) kể từ lúc đăng nhập; phiên đã quá hạn tuyệt đối bị thu hồi khi refresh. Đổi, đặt lại mật khẩu và dùng lại refresh token cũ vẫn thu hồi phiên như trước. Mobile không cần sửa.

**1.7.3 Chưa có thông tin liên hệ của trung tâm (P2).** App chỉ ghi được "liên hệ quầy lễ tân", không có số để bấm gọi. Mobile tạm đọc số từ biến môi trường `EXPO_PUBLIC_CENTER_PHONE` (để trống thì không hiện nút "Gọi trung tâm"), nhưng đổi số phải build lại app. Đề xuất: `GET /center` (cần đăng nhập, hoặc public) trả `{ name, address, phone, email, openingHours }`, dùng chung cho bill, biên lai và màn học phí; tên trung tâm trên biên lai hiện cũng đang viết cứng ở mobile.

_Bản sửa 03/11 (chờ BE review, merge và deploy):_ `GET /center` (public) trả `{ name, address, phone, email, openingHours }` từ bảng mới `center_profiles` (một dòng, migration `20261103010000_center_profile`; chưa có dòng hoặc chưa có giá trị thì `null`). `pnpm seed` và `pnpm seed:dashboard` tạo dòng này (thông tin demo ở chế độ demo) và mỗi lần chạy ghi các biến `CENTER_NAME`, `CENTER_ADDRESS`, `CENTER_PHONE`, `CENTER_EMAIL`, `CENTER_OPENING_HOURS` có giá trị vào đó. Đã gọi thử trên BE đang chạy ở máy nhóm mobile (database thử, 03/11). Mobile đã wire (người dùng chọn "Wire luôn"): bill, biên lai, nội dung chia sẻ biên lai và nút "Gọi trung tâm" lấy tên, số từ route này; BE chưa có dữ liệu hoặc BE cũ trả 404 thì dùng tên mặc định của app và `EXPO_PUBLIC_CENTER_PHONE`. Lên Render cần chạy migration rồi chạy seed (chế độ `accounts` trên production) với các biến `CENTER_*`.

### 1.8 Đợt CLO và phân trang (bổ sung 27/10)

Đối chiếu `dev` tại `c9ecbcd` (PR #10 `feture/data-sees-clo`, merge `e2cb844`, cùng `c9ecbcd`) và bản bàn giao cho mobile ngày 26/10. Rút ra từ **đọc code**, chưa chạy trên BE đang chạy. Mobile đã sửa phần của mình ngày 27/10 (đọc hết các trang, khối "Mục tiêu bài" và "Mục tiêu khóa học").

**1.8.1 Bỏ `paginated` mà chỉ trả 20 dòng là đổi contract (ghi nhận).** Bản mobile đã cài trên máy phụ huynh trước 27/10 gọi `GET /me/students`, `GET /me/students/:id/enrollments`, `GET /rooms` không có `page`, `limit`, và đọc `history` của `GET /academic/me/students/:id/attendance` như danh sách đầy đủ, nên từ dòng 21 sẽ thiếu con, thiếu môn và học phí, thiếu tên phòng, thiếu buổi trong lịch sử điểm danh mà không báo lỗi. Bản bàn giao chỉ nhắc ba route đầu; `GET /rooms` và `history` của điểm danh cũng bị (bản bàn giao còn ghi mobile dùng mock điểm danh, thực ra đã nối BE từ 15/10). Nhờ BE báo trước các thay đổi kiểu này (xem mục 3).

**1.8.2 `learningTargets` không có thứ tự cố định (P2).** `detail` trong `assessment.service.ts` lấy `outcomeSet.outcomes` không có `orderBy`, trong khi `GET /academic/programs/:id/outcome-sets` xếp CLO theo `code`. Mobile và web giữ thứ tự BE trả, nên khối "Mục tiêu bài" có thể khác thứ tự với "Mục tiêu khóa học" và đổi thứ tự giữa hai lần mở. Đề xuất: `orderBy: { code: 'asc' }` ở `detail`. Đã có bản sửa 03/11, xem mục 1.9.2.

**1.8.3 Quyền xem CLO của khóa chỉ xét lớp lúc đăng ký (P2).** `list` trong `outcome.service.ts` cho `PARENT` tìm ghi danh có `class.programId` bằng khóa cần xem, không xét `placements`. Con đã chuyển sang lớp thuộc chương trình khác thì nhận 403 `FORBIDDEN` khi xem mục tiêu khóa đang học; mobile ẩn khối "Mục tiêu khóa học" trong trường hợp này. Đề xuất: chấp nhận cả `placements.some.class.programId`. Đã có bản sửa 03/11, xem mục 1.9.3.

**1.8.4 Lịch sử điểm danh phân trang nhưng mỗi trang vẫn đọc cả kỳ (ghi nhận).** `attendanceSummary` đọc tới 20.000 bản ghi rồi mới cắt trang, nên mobile đọc 100 dòng mỗi trang thì con có 300 buổi sẽ khiến BE quét cả kỳ ba lần. Thẻ tỷ lệ đi học ở trang chủ gửi `limit=1` vì chỉ cần `counts`. Chưa cần sửa; nếu dữ liệu lớn lên thì nhờ BE cân nhắc phân trang trong database.

### 1.9 Đợt chấm bài bằng AI và CLO (bổ sung 03/11)

Đối chiếu `dev` tại `0289bbf` (PR #11 `feature/AI`, commit `8c99e41`, merge `a979e27`; `0289bbf` chỉ đồng bộ `pnpm-lock.yaml`) và web `WDP301-FE-System` trên `origin/dev`. Rút ra từ **đọc code**, chưa chạy trên BE đang chạy. Không có migration mới; contract các route phụ huynh đang dùng không đổi.

**Đã có bản sửa (03/11), chờ BE review và merge.** Các mục 1.8.2, 1.8.3, 1.9.1, 1.9.2, 1.9.3 và 1.9.4 đã được sửa trong bản checkout `dev` của BE trên máy nhóm mobile (chưa commit, chưa có trên Render). Có unit test mới (`tests/unit/grading-worker.spec.ts`, thêm case trong `ai-grading-skill.spec.ts` và `clo-crud.spec.ts`); `pnpm typecheck` qua, unit test 201/203 qua, hai test lỗi cần MinIO đang chạy (`minio-smoke.spec.ts`) và thư viện đọc PDF (`assignment-document-extraction.spec.ts`), không liên quan. Chưa chạy e2e và chưa thử với AI thật. File sửa: `ai-grading-skill.ts`, `grading-worker.service.ts`, `assessment.service.ts`, `outcome.service.ts`, `scripts/full-academic-flow-simulation.ts` và tài liệu `.agents/skills/ai-grading/SKILL.md`, `CHANGELOG_UPDATES.md`, `BUSINESS_LOGIC_IMPLEMENTATION_STATUS.md`. Cách sửa ghi dưới từng mục.

**1.9.1 Lời nhắc cho giáo viên của AI có thể tới phụ huynh (P1).** Quy tắc 5 của `GRADING_SKILL_INSTRUCTION` (`ai-grading-skill.ts`) bảo AI viết thêm vào `feedback` của câu: "(Lưu ý: Học sinh có đính kèm file/ảnh bài làm, giáo viên vui lòng kiểm tra thêm tệp đính kèm để cho điểm chính xác nhất)" khi bài nộp có ảnh. Trên web, nút áp đề xuất AI chép thẳng `feedback` của từng câu tự luận vào ô nhận xét của câu đó (`grading-workspace.tsx`). Nếu giáo viên không xoá câu này thì sau khi công bố điểm, phụ huynh sẽ thấy nó ở mục "Nhận xét" của câu trên mobile (mobile hiện `scores[].feedback` của bản `PUBLISHED`). Từ 21/10 mobile cho học sinh gửi ảnh bài làm và để trống câu tự luận khi bài làm nằm trong ảnh, nên trường hợp này sẽ hay gặp. Với những câu đó AI chỉ chấm được phần chữ (đang để trống), nên sẽ đề xuất 0 điểm kèm nhận xét "thiếu bước". Đề xuất: tách lời nhắc cho giáo viên ra khỏi `feedback`, ví dụ thêm field `teacherNote` vào `GradingJob.result` hoặc trả cờ `hasAttachments` để web tự hiện cảnh báo, để `feedback` chỉ còn nhận xét gửi học sinh. Web nên ghi rõ cạnh nút áp đề xuất rằng câu có ảnh phải chấm theo ảnh.

_Bản sửa 03/11:_ quy tắc 5 của prompt nay ghi `feedback` là lời gửi học sinh và phụ huynh, cấm viết lời nhắc cho giáo viên và nhắc tới tệp đính kèm; payload gửi AI không còn `hasAttachments`. Bài nộp có tệp thì câu tự luận để trống (chỉ có khoảng trắng cũng tính) không gửi cho AI và không có đề xuất điểm; id các câu đó nằm ở `GradingJob.result.manualReviewQuestionIds` (luôn có, mảng rỗng khi không có câu nào). Mọi câu đều nằm trong tệp thì BE không gọi AI, job `SUCCEEDED` với `scores: []`. Câu tự luận có chữ vẫn được AI chấm theo phần chữ. Web không cần sửa để chạy đúng: nút "Dùng gợi ý cho câu tự luận" chỉ ghi câu có đề xuất (`suggestions.find`), nên câu chấm theo ảnh giữ nguyên giá trị giáo viên đang nhập. Nhưng dòng chữ cạnh nút "Gợi ý AI" (`grading-workspace.tsx`: "AI sẽ ... nhắc giáo viên kiểm tra tệp đính kèm") nay đã cũ; đề xuất web đổi thành "AI chỉ chấm phần chữ; câu để trống chấm theo tệp" và đánh dấu các câu trong `manualReviewQuestionIds`.

**1.9.2 `learningTargets` chưa có `required` (P2).** Khối "Mục tiêu khóa học" ghi "Mục tiêu mở rộng, không bắt buộc" dưới mỗi CLO có `required: false`, nhưng `detail` (`assessment.service.ts`) của bài tập chỉ chọn `id, code, title, statement`. Từ 03/11 mobile gọi thêm `GET /academic/outcome-sets/:id` (route mới của PR #11) để lấy `required` cho khối "Mục tiêu bài", nên mỗi lần mở một bài có CLO mất thêm một request. Đề xuất: thêm `required` vào phần chọn `outcomeSet.outcomes` trong `detail`, cùng `orderBy: { code: 'asc' }` của mục 1.8.2 (chưa sửa). Khi BE có field này, mobile sẽ bỏ request thêm.

_Bản sửa 03/11 (cả mục 1.8.2):_ `detail` chọn thêm `required` và xếp `outcomeSet.outcomes` theo `code`. Field mới, web và mobile bản cũ không vỡ. Mobile vẫn gọi `GET /academic/outcome-sets/:id` cho tới khi bản này lên Render.

**1.9.3 Route CLO mới cũng chỉ xét lớp lúc đăng ký (P2, giống mục 1.8.3).** Với phụ huynh, `getSet` và `getOutcome` (`outcome.service.ts`) chỉ tìm ghi danh có `class.programId` trùng khóa của bộ, không xét `placements`. Khi BE trả 403, mobile vẫn hiện mục tiêu bài nhưng bỏ ghi chú "không bắt buộc".

_Bản sửa 03/11 (cả mục 1.8.3):_ `list`, `getSet` và `getOutcome` dùng chung `assertParentProgram`, chấp nhận ghi danh có lớp lúc đăng ký **hoặc** một `placements` thuộc khóa đó.

**1.9.4 Script mô phỏng chưa thử route gửi ảnh mà mobile dùng (ghi nhận).** `scripts/full-academic-flow-simulation.ts` gọi `POST /api/v1/academic/files/upload`, route không tồn tại (route đúng là `POST /academic/files`). Nhánh đó còn bị tắt cứng (`storageAvailable = false`), nên bước "Học sinh nộp kèm ảnh" tạo `FileAsset` thẳng trong database. Kết quả "8/8 bước" trong `CHANGELOG_UPDATES.md` vì vậy chưa kiểm tra việc gửi ảnh qua API.

_Bản sửa 03/11:_ script gọi `POST /api/v1/academic/files` và chỉ tạo `FileAsset` thẳng trong database khi `ObjectStorageService.available()` là false. Chưa chạy lại script. Lưu ý thêm (chưa sửa): script tự đặt `DATABASE_URL` là `edugrade_db` và ghi đè biến môi trường, nên chạy script là ghi dữ liệu mô phỏng vào database chính.

### 1.10 Realtime của mobile bị từ chối trên Render (P1, bổ sung 03/11)

Thấy trên **BE đang chạy** (Render, ngày 03/11) với app chạy trên Android emulator: ngay khi phụ huynh đăng nhập, bắt tay Socket.IO `/notifications` bị từ chối với `ORIGIN_NOT_ALLOWED`, nên phụ huynh không nhận thông báo realtime (chuông và hộp thư vẫn chạy qua REST). Nguyên nhân: WebSocket của React Native tự gửi header `Origin` bằng gốc của địa chỉ server, ở đây là `https://wdp301-be-system.onrender.com` (thấy trên Android; theo mã nguồn thì iOS cũng gửi, chưa thử). `authenticate` trong `notifications.gateway.ts` từ chối mọi `Origin` có giá trị mà không nằm trong `CORS_ORIGINS`. Lần thử realtime ngày 20/10 qua được vì script dùng `ws` của Node, không gửi `Origin`. Đề xuất, chọn một:

- Thêm gốc của chính BE (`https://wdp301-be-system.onrender.com`, và `http://<IP LAN>:3000` khi chạy local) vào `CORS_ORIGINS` trên Render. Nhanh nhất, không sửa code.
- Hoặc gateway chấp nhận `Origin` trùng với host của chính request (`socket.handshake.headers.host`): app native gửi đúng giá trị này, còn trang web lạ thì không.

Mobile không đặt `Origin` giả để vượt kiểm tra.

_Bản sửa 03/11 (chờ BE review, merge và deploy lên Render):_ theo cách thứ hai. `isSameHostOrigin` trong `notifications.gateway.ts` cho qua `Origin` có host trùng header `Host` của request; `Origin` có trong `CORS_ORIGINS` vẫn qua như cũ, trang web khác vẫn bị `ORIGIN_NOT_ALLOWED`. Có unit test `tests/unit/notifications-gateway.spec.ts`; đã cập nhật `docs/notifications-api.md` và `NOTIFICATION_FLOW_GUIDE.md`. Chưa thử với BE đang chạy. Trước khi bản này lên Render, muốn realtime chạy ngay thì thêm `https://wdp301-be-system.onrender.com` vào `CORS_ORIGINS` trên Render.

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

| Ưu tiên | Nhu cầu                                        | Hiện trạng BE                                               | Đề xuất                                                |
| ------- | ---------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| P1      | Xác minh email không phải chép mã dài          | Email chỉ có mã 43 ký tự (đã có bản sửa 03/11: mã 6 số)     | Link mở app hoặc mã 6 số (mục 1.7.1)                   |
| P1      | Không phải đăng nhập lại mỗi tuần              | Phiên hết hạn cố định 7 ngày (đã có bản sửa 03/11)          | Gia hạn khi refresh, kèm hạn tuyệt đối (mục 1.7.2)     |
| P2      | Số điện thoại, địa chỉ trung tâm               | Không có (đã có bản sửa 03/11, mobile đã wire)              | `GET /center` (mục 1.7.3)                              |
| P2      | Tên phòng trên thẻ môn học                     | Ghi danh chỉ có `class.roomId` (đã có bản sửa 03/11)        | Thêm `class.room { id, name }` (mục 1.2)               |
| P2      | Lộ trình của môn sắp học                       | Chỉ trả cho ghi danh đang trong kỳ (đã có bản sửa 03/11)    | Trả cả ghi danh sắp học (mục 1.1)                      |
| P2      | Báo phụ huynh khi app đóng                     | Chỉ có Socket.IO khi app mở (người dùng chọn để sau, 03/11) | Cần chốt chung (mục 1.5)                               |
| P2      | Biết CLO nào không bắt buộc ngay trong bài     | `learningTargets` không có `required` (đã có bản sửa 03/11) | Thêm `required` vào `learningTargets` (mục 1.9.2)      |
| P2      | Giờ vào lớp, nhận xét riêng từng con, tài liệu | Chỉ có `summary` chung (để sau, cần màn nhập trên web)      | Thêm vào `participation` và buổi học khi BE có dữ liệu |

Trang chủ không cần route tổng quan riêng: mobile đã ghép từ lịch học, điểm danh, điểm, bài tập, bill và thông báo.

Chưa làm ở mobile, chờ nhóm chốt (không phải yêu cầu với BE): phụ huynh gửi đơn xin nghỉ trên app (`POST /academic/leaves` đã cho `PARENT`; SRS mục 3.5 chưa ghi, mục 6.4 ghi "Phụ huynh báo nghỉ"). Đính kèm ảnh bài tự luận đã làm ngày 21/10; từ 28/10 phụ huynh xem lại ảnh đã nộp qua `GET /academic/files/:id/preview` (`inline`, 300 giây), mobile không dùng `GET /academic/files/:id/download`.

## 3. Contract mobile đang dựa vào

Đổi các điểm sau cần báo mobile trước:

- `scheduled-sessions` (role `PARENT`, có `studentId`, `paginated=true`): `{ items, page, limit, total }`, buổi theo `startsAt` tăng dần, gồm buổi `CANCELLED`; mỗi buổi có `id`, `classId`, `startsAt`, `endsAt` (UTC), `status`, `cancelReason`, `class.name`, `class.program.subject`, `teacher.displayName`, `room.name | null`, `lesson { id, title, kind }` (`LESSON` | `MONTHLY_TEST`), `participations[] { enrollmentId, kind, attendance }` (chỉ chỗ chưa huỷ). Mobile gửi `fromDate`, `toDate` dạng `YYYY-MM-DD`, `limit=100`; khoảng dài nhất là một kỳ ghi danh. Buổi chưa có participant thì mobile gán vào ghi danh theo `placements` (ghi danh `ACTIVE`, ngày học trong `[startDate, endDate)`, lớp khớp placement).
- `scheduled-sessions/:id?studentId` (role `PARENT`): `id`, `startsAt`, `endsAt`, `status`, `summary`, `cancelReason`, `class { name, program { subject } }`, `teacher { displayName }`, `room { name } | null`, `lesson { id, title }`, `participation { enrollmentId, kind, attendance } | null`. Mobile coi 404 `SESSION_NOT_FOUND` và 403 `FORBIDDEN` là "buổi không có trong lịch của con".
- `me/students/:id/attendance?page&limit`: `counts { present, absent, madeUp, excused }` tính trên cả kỳ, `total` và `history[] { enrollmentId, effectiveStatus, session { id, startsAt, endsAt }, class { name, program { subject } }, approvedLeave { reason } | null, latestMakeup { status, replacement { session { startsAt } } } | null }` của trang. Mobile không gửi `fromDate`, `toDate`, đọc hết `history` (`limit=100`) theo `total`, gửi `limit=1` khi chỉ cần `counts`, và tính tỷ lệ = (`present` + `madeUp`) / (`present` + `madeUp` + `absent`), cùng công thức với BE.
- `me/students/:id/grades`: `subjects[] { subject, averageOutOf10 }`, `history[] { scoreOutOf10, publishedAt }`, `total`. Mobile đọc hết các trang (`limit=100`) để tính điểm trung bình mọi bài và chênh lệch so với điểm trung bình tính tới hết tháng trước.
- `me/students/:id/curriculum`: `{ items, total }`, mỗi học phần có `classes[] { id }`, `lessons[] { id, title, sequence, kind }`. Mobile khớp bài với buổi theo `lesson.id` của buổi.
- `assignments?studentId&paginated=true`: mỗi bài có `id`, `classId`, `testType`, `title`, `dueAt`, `maxAttempts`, `class { name, program { subject } }`, `questionCounts { multipleChoice, essay }`, `maxScore`, `recipients[] { studentId, latestSubmission { attemptNo, submittedAt, publishedGrade { totalScore, feedback, publishedAt } | null } | null }`.
- `assignments/:id`: `classId`, `title`, `instructions`, `dueAt`, `status`, `maxAttempts`, `recipients[] { id, enrollmentId }`, `questions[] { id, kind, prompt, choices, maxScore, correctAnswer?, outcomeId }`, `learningTargets[] { id, code, title }` (cả bộ CLO; mobile chỉ hiện CLO có câu hỏi gắn `outcomeId`, giữ thứ tự BE trả).
- `programs/:id/outcome-sets?paginated=true&page=1&limit=1` (role `PARENT`): `{ items, total }`, phiên bản mới nhất trước; mobile đọc `items[0].outcomes[] { id, code, title, required }`. 403 `FORBIDDEN` và 404 `PROGRAM_NOT_FOUND` thì mobile ẩn khối. `outcome-sets/:id` (role `PARENT`, từ 03/11): mobile đọc `outcomes[] { id, required }` của bộ ghi trong `assignments/:id` (`outcomeSetId`); 404 `OUTCOME_SET_NOT_FOUND`, 403 `FORBIDDEN` hay lỗi khác thì mobile chỉ bỏ ghi chú "không bắt buộc". `assignments/:id/submissions?paginated=true`: `recipientId`, `attemptNo`, `answers`, `submittedAt`, `grades[]` chỉ gồm bản `PUBLISHED`, bản sửa mới nhất trước.
- `leaves?paginated=true`: `enrollmentId`, `fromDate`, `toDate` của đơn `PERIOD_PAUSE` `APPROVED` (trạng thái tạm nghỉ của môn).
- `me/students?paginated=true`, `me/students/:id/enrollments?paginated=true`, `rooms?paginated=true`: `{ items, page, limit, total }`, mobile gửi `limit=100` và đọc hết các trang theo `total`. Ghi danh: `placements { classId, effectiveFrom, effectiveTo, class { id, name, programId, roomId, program, weeklySchedules, teacher { displayName } | null } }`, `class` cùng dạng; phòng: `id`, `name`.
- `me/bills` (không gửi `paginated`): `{ items, page, limit, total }`, mới lập trước; mỗi bill mobile đọc `registrationId`, `status` (`UNPAID` | `PAID` | `CANCELLED`), `issuedAt`, `student.id`, `class.name`, `term`, `pricing.total`, `pricing.currency`.
- `notifications`: `{ items, page, limit, total }`, mỗi thông báo `id`, `type`, `title`, `body`, `target { kind, id }`, `context { studentIds }`, `createdAt`, `readAt`. Mobile mở bài tập (`ASSIGNMENT`) và buổi học (`SESSION`) theo `context.studentIds[0]`, bill theo `REGISTRATION`; loại khác chỉ đánh dấu đã đọc. `unread-count`: `{ unreadCount }`.
- Socket.IO: `io('<gốc server>/notifications', { path: '/socket.io', transports: ['websocket'], auth: { token } })`, sự kiện `notification.created` và `notifications.read-changed`, lỗi kết nối `AUTH_UNAUTHORIZED` (mobile refresh rồi kết nối lại một lần), `ORIGIN_NOT_ALLOWED` (dừng), các mã khác (thử lại chậm dần).
- `auth`: `GET /auth/me` và `PATCH /auth/me` trả `phone`; `PATCH /auth/me` body `{ displayName, phone }` với `phone: ""` là xoá số; `POST /auth/change-password` body `{ currentPassword, newPassword }` (8–72 ký tự), giữ phiên hiện tại; `POST /auth/forgot-password` body `{ email }`, trả 202 cả khi email chưa đăng ký.
- Mã lỗi mobile có thông báo tiếng Việt: `AUTH_CURRENT_PASSWORD_INVALID`, `SUBMISSION_CLOSED`, `ATTEMPTS_EXHAUSTED`, `INVALID_ANSWERS`, `INVALID_CHOICE`, `RESOURCE_NOT_FOUND`, `FORBIDDEN`, `INVALID_DATE_RANGE` (từ 27/10).

## 4. Đề nghị để nghiệm thu chung

- Môi trường test chạy đủ migration tới `c3b54d4` (gồm `20261019000000_assignment_metadata` và `20261019001000_notifications`) và có dữ liệu: một tài khoản `PARENT` đã xác minh với hai con; mỗi con một ghi danh đang học ở lớp đã sinh buổi từ học phần đã duyệt (có bài kiểm tra tháng) và đã có buổi chốt điểm danh; một buổi vắng có đơn nghỉ đã duyệt và lịch học bù ở lớp khác; một con có đơn tạm nghỉ đã duyệt; một con đã chuyển lớp; một buổi bị huỷ; một bài tập đang mở, một bài kiểm tra 15 phút đã công bố điểm và một đơn đăng ký chưa xác nhận thu tiền (bill `UNPAID`). Nhờ BE cho biết seed (`pnpm seed:dashboard`) tạo tài khoản phụ huynh nào phủ được các trường hợp trên.
- Để thử realtime: chạy một instance BE, cho điện thoại kết nối được tới cổng BE qua mạng LAN (không dùng `localhost`), rồi lần lượt công bố điểm, chốt điểm danh, huỷ một buổi, lập bill cho con của phụ huynh đó.
- Cấu hình `SMTP_URL`, `MAIL_FROM` và `WEB_ORIGIN` (địa chỉ điện thoại truy cập được) trên môi trường test: thiếu SMTP thì phụ huynh tự đăng ký không nhận được mã xác minh và link đặt lại mật khẩu.
- Cấu hình kho lưu trữ (`STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, kèm `STORAGE_ENDPOINT` nếu dùng MinIO) trên môi trường test: thiếu thì `POST /academic/files` trả 503 và học sinh không gửi được ảnh bài làm.
