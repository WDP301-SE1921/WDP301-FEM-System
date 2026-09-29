import type { ClaimSignUpInput } from './schemas';

/**
 * Cach dung ma. Tai lieu BE moi co `CREATE_ACCOUNT`; `SIGN_IN` (email da co tai khoan)
 * la ten tam, doi lai khi BE chot. Gia tri la khac `CREATE_ACCOUNT` deu xu ly nhu `SIGN_IN`.
 */
export type InvitationMode = 'CREATE_ACCOUNT' | 'SIGN_IN';

/** Response POST /link-invitations/inspect (EDUGRADE_BACKEND_FLOW.md §6.3). */
export type InvitationPreview = {
  valid: true;
  mode: InvitationMode;
  maskedEmail: string;
  studentName: string;
  subjectName: string;
  className: string;
  expiresAt: string;
};

/** BE co the tra `valid: false` thay vi loi HTTP cho ma khong dung duoc. */
export type InspectInvitationResult = InvitationPreview | { valid: false };

/**
 * Body POST /link-invitations/claim-and-sign-up (§6.4). Email lay tu ma, client khong gui.
 * BE nhan them `displayName` tuy chon nhung man hinh theo thiet ke khong hoi ho ten.
 */
export type ClaimAndSignUpPayload = Pick<ClaimSignUpInput, 'password'> & { token: string };

/**
 * Response POST /link-invitations/claim (§6.5). Tai lieu BE chua ghi response: day la hop dong TAM
 * cua mock, doi lai khi BE chot.
 */
export type ClaimInvitationResult = {
  studentId: string;
  studentName: string;
};

/**
 * Ai dang dung ma: phu huynh chua dang nhap (tao tai khoan hoac chuyen sang dang nhap) hay
 * phu huynh da dang nhap lien ket them con. Thong bao loi cua cung mot ma loi khac nhau theo do.
 */
export type InvitationContext = 'SIGN_UP' | 'ADD_CHILD';
