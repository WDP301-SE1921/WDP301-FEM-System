import { parseDateKey, toDateKey } from '@/utils/date';

import { BIRTH_DATE_DIGITS, CHILD_GRADES } from './constants';
import type { AddChildInput } from './schemas';
import type {
  ChildFormDefaults,
  ChildProfile,
  CreateChildPayload,
  UpdateChildPayload,
} from './types';

const NON_DIGITS = /\D/g;
const BIRTH_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const BIRTH_DATE_SEPARATOR = '/';
const DATE_KEY_SEPARATOR = '-';
/** Vi tri het phan ngay va phan thang trong chuoi chu so `ddmmyyyy`. */
const DAY_END = 2;
const MONTH_END = 4;
/** Do dai phan ngay `YYYY-MM-DD` o dau chuoi ngay BE tra. */
const API_DATE_LENGTH = 10;

/**
 * Tu chen dau `/` khi go ngay sinh bang ban phim so (khong co phim `/`), vd "1508201" -> "15/08/201".
 * Dan ca chuoi "15/08/2013" van ra dung.
 */
export function formatBirthDateInput(input: string): string {
  const digits = input.replace(NON_DIGITS, '').slice(0, BIRTH_DATE_DIGITS);
  return [digits.slice(0, DAY_END), digits.slice(DAY_END, MONTH_END), digits.slice(MONTH_END)]
    .filter((part) => part.length > 0)
    .join(BIRTH_DATE_SEPARATOR);
}

/** Doc ngay sinh `dd/mm/yyyy`, tra 00:00 cua ngay do. Sai dinh dang hoac ngay khong ton tai thi tra null. */
export function parseBirthDate(text: string): Date | null {
  const match = BIRTH_DATE_PATTERN.exec(text);
  if (!match) return null;

  const [, day, month, year] = match;
  return parseDateKey(`${year}-${month}-${day}`);
}

/**
 * Ngay sinh BE tra (`2013-03-15T00:00:00.000Z`) sang dang `dd/mm/yyyy` cua o nhap. Chi lay phan ngay
 * de may o mui gio am khong bi lui mot ngay. Chua co ngay sinh hoac sai dinh dang thi tra chuoi rong.
 */
export function formatBirthDate(value: string | null): string {
  const dateKey = value?.slice(0, API_DATE_LENGTH) ?? '';
  if (!parseDateKey(dateKey)) return '';

  const [year, month, day] = dateKey.split(DATE_KEY_SEPARATOR);
  return [day, month, year].join(BIRTH_DATE_SEPARATOR);
}

/** Doi gia tri form sang body gui BE: ngay sinh sang `YYYY-MM-DD`, bo trong thi khong gui. */
export function toCreateChildPayload({
  fullName,
  grade,
  dateOfBirth,
}: AddChildInput): CreateChildPayload {
  const birthDate = parseBirthDate(dateOfBirth);
  const payload = { fullName: fullName.trim(), grade };
  return birthDate ? { ...payload, dateOfBirth: toDateKey(birthDate) } : payload;
}

/** Body sua ho so: gui du ba field, ngay sinh bo trong thi gui null de xoa ngay sinh cu. */
export function toUpdateChildPayload({
  fullName,
  grade,
  dateOfBirth,
}: AddChildInput): UpdateChildPayload {
  const birthDate = parseBirthDate(dateOfBirth);
  return {
    fullName: fullName.trim(),
    grade,
    dateOfBirth: birthDate ? toDateKey(birthDate) : null,
  };
}

/** Gia tri ban dau cua form sua, lay tu ho so hien tai cua con. */
export function toChildFormDefaults({
  fullName,
  grade,
  dateOfBirth,
}: ChildProfile): ChildFormDefaults {
  return {
    fullName,
    // Khoi ngoai 6-9 thi de trong cho phu huynh chon lai
    grade: CHILD_GRADES.find((childGrade) => childGrade === grade),
    dateOfBirth: formatBirthDate(dateOfBirth),
  };
}
