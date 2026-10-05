import axios from 'axios';

import { Endpoints } from '@/api/endpoints';
import { academicRoutes, type MockSubmission } from '@/api/mocks/academic';
import { authRoutes } from '@/api/mocks/auth';
import { createMockAdapter } from '@/api/mocks/mock-adapter';
import type { MockQuestion } from '@/api/mocks/mock-assignment-details';
import type { MockAssignment } from '@/api/mocks/mock-assignments';
import { parentRoutes } from '@/api/mocks/parent';
import { registrationFlowRoutes } from '@/api/mocks/registration-flow';

// logger doc Config -> can bien moi truong; test nay khong can log
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

/**
 * Cac route mock ghi du lieu (sua ho so con, nop bai) tach khoi `mock-api.test.ts`: moi file test co
 * bo nho mock rieng nen bai nop o day khong lam doi danh sach bai tap ma file kia kiem tra.
 */
const client = axios.create({
  adapter: createMockAdapter(
    [...authRoutes, ...parentRoutes, ...registrationFlowRoutes, ...academicRoutes],
    0,
  ),
});

const PASSWORD = 'Matkhau123';
const DEMO_PARENT_EMAIL = 'phuhuynh@example.com';
const OTHER_PARENT_EMAIL = 'phuhuynh.cu@example.com';
const TEACHER_EMAIL = 'giaovien@example.com';
const MINH_ANH_ID = 'mock-student-1';
const HOANG_LONG_ID = 'mock-student-2';

type AssignmentDetail = {
  id: string;
  status: 'PUBLISHED' | 'CLOSED';
  maxAttempts: number;
  recipients: { id: string; enrollmentId: string }[];
  questions: (Omit<MockQuestion, 'correctAnswer'> & { correctAnswer?: string })[];
};

async function loginAs(email: string) {
  const { data } = await client.post<{ data: { tokens: { accessToken: string } } }>(
    Endpoints.auth.login,
    { email, password: PASSWORD },
  );
  return { headers: { Authorization: `Bearer ${data.data.tokens.accessToken}` } };
}

/** Lay status va ma loi tu request bi reject. */
async function captureError(request: Promise<unknown>) {
  try {
    await request;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return { status: error.response?.status, code: error.response?.data?.error?.code };
    }
  }
  throw new Error('Request khong bi reject');
}

async function getAssignments(auth: Awaited<ReturnType<typeof loginAs>>) {
  const { data } = await client.get<{ data: MockAssignment[] }>(
    Endpoints.parent.studentAssignments(MINH_ANH_ID),
    auth,
  );
  return data.data;
}

async function getDetail(auth: Awaited<ReturnType<typeof loginAs>>, assignmentId: string) {
  const { data } = await client.get<{ data: AssignmentDetail }>(
    Endpoints.academic.assignment(assignmentId),
    auth,
  );
  return data.data;
}

async function getSubmissions(auth: Awaited<ReturnType<typeof loginAs>>, assignmentId: string) {
  const { data } = await client.get<{ data: MockSubmission[] }>(
    Endpoints.academic.assignmentSubmissions(assignmentId),
    auth,
  );
  return data.data;
}

/** Tra loi moi cau: cau trac nghiem chon lua chon dau tien, cau tu luan ghi mot dong. */
function answerAll(questions: AssignmentDetail['questions']) {
  return questions.map(({ id, choices }) => ({
    questionId: id,
    answer: choices?.[0] ?? 'Bài làm của con',
  }));
}

describe('api/mocks: ho so con va nop bai', () => {
  describe('GET /me/students', () => {
    it('tra ban ghi StudentProfile cua phu huynh kem ngay sinh dang cot ngay Prisma', async () => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);
      const { data } = await client.get(Endpoints.me.students, auth);

      expect(data.data).toEqual([
        expect.objectContaining({
          id: MINH_ANH_ID,
          fullName: 'Nguyễn Minh Anh',
          grade: 8,
          dateOfBirth: '2013-03-15T00:00:00.000Z',
          status: 'ACTIVE',
        }),
        expect.objectContaining({ id: HOANG_LONG_ID, grade: 6, dateOfBirth: null }),
      ]);
    });

    it('chi PARENT duoc goi, thieu Bearer 401', async () => {
      expect(await captureError(client.get(Endpoints.me.students))).toMatchObject({ status: 401 });
      expect(
        await captureError(client.get(Endpoints.me.students, await loginAs(TEACHER_EMAIL))),
      ).toEqual({ status: 403, code: 'FORBIDDEN' });
    });
  });

  describe('GET /academic/assignments/:id', () => {
    it('bai chua nop dang mo: co cau hoi va recipient cua con, chua co dap an dung', async () => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);
      const assignments = await getAssignments(auth);
      const todo = assignments.find(
        ({ submission, questionCounts }) =>
          submission === null && questionCounts.MULTIPLE_CHOICE > 0,
      );
      expect(todo).toBeDefined();

      const detail = await getDetail(auth, todo?.id ?? '');
      expect(detail).toMatchObject({
        id: todo?.id,
        title: todo?.title,
        status: 'PUBLISHED',
        maxAttempts: 2,
        recipients: [
          { id: expect.any(String), enrollmentId: expect.stringMatching(/^mock-enrollment-/) },
        ],
      });
      expect(detail.questions).toHaveLength(todo?.questionCounts.MULTIPLE_CHOICE ?? 0);
      detail.questions.forEach((question) => {
        expect(question).toMatchObject({ kind: 'MULTIPLE_CHOICE', choices: expect.any(Array) });
        expect(question).not.toHaveProperty('correctAnswer');
      });
      expect(detail.questions.reduce((total, { maxScore }) => total + maxScore, 0)).toBe(10);
      expect(await getSubmissions(auth, detail.id)).toEqual([]);
    });

    it('bai da co diem: da dong, co dap an dung, diem tung cau cong lai bang diem cua bai', async () => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);
      const graded = (await getAssignments(auth)).filter(({ grade }) => grade !== null);
      expect(graded.length).toBeGreaterThan(0);

      for (const assignment of graded) {
        const detail = await getDetail(auth, assignment.id);
        expect(detail.status).toBe('CLOSED');
        detail.questions.forEach(({ correctAnswer }) =>
          expect(correctAnswer).toEqual(expect.any(String)),
        );

        const [submission, ...rest] = await getSubmissions(auth, assignment.id);
        expect(rest).toEqual([]);
        expect(submission).toMatchObject({
          recipientId: detail.recipients[0]?.id,
          attemptNo: 1,
          submittedAt: assignment.submission?.submittedAt,
        });
        expect(submission?.answers.map(({ questionId }) => questionId)).toEqual(
          detail.questions.map(({ id }) => id),
        );
        const [grade] = submission?.grades ?? [];
        expect(grade).toMatchObject({
          status: 'PUBLISHED',
          totalScore: assignment.grade?.totalScore,
          publishedAt: assignment.grade?.publishedAt,
        });
        expect(grade?.scores.reduce((total, { score }) => total + score, 0)).toBe(
          assignment.grade?.totalScore,
        );
      }
    });

    it('bai khong giao cho con cua phu huynh 403, giao vien 403, thieu Bearer 401', async () => {
      const demo = await loginAs(DEMO_PARENT_EMAIL);
      const [assignment] = await getAssignments(demo);
      const url = Endpoints.academic.assignment(assignment?.id ?? '');
      const forbidden = { status: 403, code: 'FORBIDDEN' };

      expect(await captureError(client.get(url))).toMatchObject({ status: 401 });
      expect(await captureError(client.get(url, await loginAs(OTHER_PARENT_EMAIL)))).toEqual(
        forbidden,
      );
      expect(await captureError(client.get(url, await loginAs(TEACHER_EMAIL)))).toEqual(forbidden);
      // Phu huynh khac khong thay bai nop cua con nguoi khac
      expect(await getSubmissions(await loginAs(OTHER_PARENT_EMAIL), assignment?.id ?? '')).toEqual(
        [],
      );
    });
  });

  // Tu day cac test ghi vao bo nho mock
  describe('PATCH /me/students/:id', () => {
    it('sua ho ten va ngay sinh; danh sach con o ca hai route deu doi theo', async () => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);

      const { status, data } = await client.patch(
        Endpoints.me.student(HOANG_LONG_ID),
        { fullName: '  Nguyễn Hoàng Long Nhật ', grade: 6, dateOfBirth: '2015-09-02' },
        auth,
      );
      expect(status).toBe(200);
      expect(data.data).toMatchObject({
        id: HOANG_LONG_ID,
        fullName: 'Nguyễn Hoàng Long Nhật',
        grade: 6,
        dateOfBirth: '2015-09-02T00:00:00.000Z',
      });

      const linked = await client.get(Endpoints.parent.students, auth);
      expect(linked.data.data).toContainEqual(
        expect.objectContaining({ id: HOANG_LONG_ID, fullName: 'Nguyễn Hoàng Long Nhật' }),
      );

      // null xoa ngay sinh, field khong gui thi giu nguyen
      const cleared = await client.patch(
        Endpoints.me.student(HOANG_LONG_ID),
        { dateOfBirth: null },
        auth,
      );
      expect(cleared.data.data).toMatchObject({
        fullName: 'Nguyễn Hoàng Long Nhật',
        dateOfBirth: null,
      });
    });

    it('khong doi duoc khoi khi con dang co mon hoc; con chua co mon thi doi duoc', async () => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);
      expect(
        await captureError(client.patch(Endpoints.me.student(MINH_ANH_ID), { grade: 9 }, auth)),
      ).toEqual({ status: 409, code: 'STUDENT_GRADE_LOCKED' });

      const created = await client.post(
        Endpoints.parent.students,
        { fullName: 'Nguyễn Gia Huy', grade: 7 },
        auth,
      );
      const updated = await client.patch(
        Endpoints.me.student(created.data.data.id),
        { grade: 8 },
        auth,
      );
      expect(updated.data.data).toMatchObject({ fullName: 'Nguyễn Gia Huy', grade: 8 });
    });

    it.each([
      ['thua field', { fullName: 'Nguyễn Minh Anh', subjectNames: [] }],
      ['ho ten rong', { fullName: '' }],
      ['khoi ngoai 6-9', { grade: 10 }],
      ['ngay sinh sai dinh dang', { dateOfBirth: '15/03/2013' }],
    ])('bao VALIDATION_ERROR khi %s', async (_case, body) => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);
      expect(
        await captureError(client.patch(Endpoints.me.student(MINH_ANH_ID), body, auth)),
      ).toEqual({ status: 400, code: 'VALIDATION_ERROR' });
    });

    it('con khong ton tai 404, con cua phu huynh khac 403, thieu Bearer 401', async () => {
      const body = { fullName: 'Tên mới' };
      const demo = await loginAs(DEMO_PARENT_EMAIL);

      expect(
        await captureError(client.patch(Endpoints.me.student(MINH_ANH_ID), body)),
      ).toMatchObject({ status: 401 });
      expect(
        await captureError(client.patch(Endpoints.me.student('khong-ton-tai'), body, demo)),
      ).toEqual({ status: 404, code: 'STUDENT_NOT_FOUND' });
      expect(
        await captureError(
          client.patch(Endpoints.me.student(MINH_ANH_ID), body, await loginAs(OTHER_PARENT_EMAIL)),
        ),
      ).toEqual({ status: 403, code: 'FORBIDDEN' });
    });
  });

  describe('POST /academic/submissions', () => {
    async function findTodo(
      auth: Awaited<ReturnType<typeof loginAs>>,
      kind: 'MULTIPLE_CHOICE' | 'ESSAY',
    ) {
      const todo = (await getAssignments(auth)).find(
        ({ submission, questionCounts }) => submission === null && questionCounts[kind] > 0,
      );
      return getDetail(auth, todo?.id ?? '');
    }

    it('tu choi body sai, recipient la, thieu cau, lua chon ngoai de va file dinh kem', async () => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);
      const detail = await findTodo(auth, 'MULTIPLE_CHOICE');
      const recipientId = detail.recipients[0]?.id ?? '';
      const answers = answerAll(detail.questions);
      const submit = (body: unknown) =>
        captureError(client.post(Endpoints.academic.submissions, body, auth));

      expect(await submit({ recipientId })).toEqual({ status: 400, code: 'VALIDATION_ERROR' });
      expect(await submit({ recipientId, answers, note: 'thua' })).toEqual({
        status: 400,
        code: 'VALIDATION_ERROR',
      });
      expect(await submit({ recipientId: 'khong-ton-tai', answers })).toEqual({
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
      });
      expect(await submit({ recipientId, answers: answers.slice(1) })).toEqual({
        status: 409,
        code: 'INVALID_ANSWERS',
      });
      const [first, ...others] = answers;
      expect(
        await submit({
          recipientId,
          answers: [{ questionId: first?.questionId, answer: 'Không có trong đề' }, ...others],
        }),
      ).toEqual({ status: 409, code: 'INVALID_CHOICE' });
      expect(await submit({ recipientId, answers, fileIds: ['file-1'] })).toEqual({
        status: 409,
        code: 'INVALID_FILES',
      });

      const otherParent = await loginAs(OTHER_PARENT_EMAIL);
      expect(
        await captureError(
          client.post(Endpoints.academic.submissions, { recipientId, answers }, otherParent),
        ),
      ).toEqual({ status: 404, code: 'RESOURCE_NOT_FOUND' });
      expect(await getSubmissions(auth, detail.id)).toEqual([]);
    });

    it('nop bai trac nghiem: bai chuyen sang da nop cho cham, nop lai duoc toi het luot', async () => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);
      const detail = await findTodo(auth, 'MULTIPLE_CHOICE');
      const body = { recipientId: detail.recipients[0]?.id, answers: answerAll(detail.questions) };

      const first = await client.post(Endpoints.academic.submissions, body, auth);
      expect(first.status).toBe(201);
      expect(first.data.data).toMatchObject({
        recipientId: body.recipientId,
        attemptNo: 1,
        submittedAt: expect.any(String),
      });

      const listed = (await getAssignments(auth)).find(({ id }) => id === detail.id);
      expect(listed).toMatchObject({
        submission: { attemptNo: 1, submittedAt: first.data.data.submittedAt },
        grade: null,
      });

      const second = await client.post(Endpoints.academic.submissions, body, auth);
      expect(second.data.data.attemptNo).toBe(2);
      const submissions = await getSubmissions(auth, detail.id);
      expect(submissions.map(({ attemptNo }) => attemptNo).sort()).toEqual([1, 2]);
      // Bai nop trong app chua ai cham nen chua co diem
      submissions.forEach(({ grades, answers }) => {
        expect(grades).toEqual([]);
        expect(answers).toEqual(body.answers);
      });

      expect(await captureError(client.post(Endpoints.academic.submissions, body, auth))).toEqual({
        status: 409,
        code: 'ATTEMPTS_EXHAUSTED',
      });
    });

    it('bai tu luan chi nop mot lan; bai da dong khong nhan bai nua', async () => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);
      const essay = await findTodo(auth, 'ESSAY');
      const body = { recipientId: essay.recipients[0]?.id, answers: answerAll(essay.questions) };

      const { status } = await client.post(Endpoints.academic.submissions, body, auth);
      expect(status).toBe(201);
      expect(await captureError(client.post(Endpoints.academic.submissions, body, auth))).toEqual({
        status: 409,
        code: 'ATTEMPTS_EXHAUSTED',
      });

      const graded = (await getAssignments(auth)).find(({ grade }) => grade !== null);
      const closed = await getDetail(auth, graded?.id ?? '');
      expect(
        await captureError(
          client.post(
            Endpoints.academic.submissions,
            { recipientId: closed.recipients[0]?.id, answers: answerAll(closed.questions) },
            auth,
          ),
        ),
      ).toEqual({ status: 409, code: 'SUBMISSION_CLOSED' });
    });

    it('nop lai bai da nop theo lich gia: giu lan nop cu, lan moi la lan thu hai', async () => {
      const auth = await loginAs(DEMO_PARENT_EMAIL);
      const waiting = (await getAssignments(auth)).find(
        ({ submission, grade, maxAttempts, dueAt }) =>
          submission?.attemptNo === 1 &&
          grade === null &&
          maxAttempts > 1 &&
          new Date(dueAt) > new Date(),
      );
      expect(waiting).toBeDefined();

      const detail = await getDetail(auth, waiting?.id ?? '');
      const [previous] = await getSubmissions(auth, detail.id);
      const { data } = await client.post(
        Endpoints.academic.submissions,
        { recipientId: detail.recipients[0]?.id, answers: answerAll(detail.questions) },
        auth,
      );
      expect(data.data.attemptNo).toBe(2);

      const submissions = await getSubmissions(auth, detail.id);
      expect(submissions).toHaveLength(2);
      expect(submissions).toContainEqual(
        expect.objectContaining({
          attemptNo: 1,
          submittedAt: previous?.submittedAt,
          answers: previous?.answers,
        }),
      );
    });
  });
});
