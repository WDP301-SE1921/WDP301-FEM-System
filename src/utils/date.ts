/** Ham tinh ngay theo gio cua may. Tuan bat dau tu Thu Hai nhu lich hoc o Viet Nam. */

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
/** `Date.getDay()` cua Thu Hai. */
const MONDAY = 1;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function padTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

/** 00:00 cung ngay voi `date`. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Cong them `days` ngay theo lich, giu nguyen gio. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** 00:00 Thu Hai cua tuan chua `date`. */
export function startOfWeek(date: Date): Date {
  const daysSinceMonday = (date.getDay() - MONDAY + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  return addDays(startOfDay(date), -daysSinceMonday);
}

/** So ngay theo lich tu `from` toi `to`, bo qua gio va doi gio mua he. Am khi `to` truoc `from`. */
export function diffInCalendarDays(from: Date, to: Date): number {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / DAY_MS);
}

/** Vd `2026-10-16`. Dung cho query string va de so sanh, gom nhom theo ngay. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`;
}

/** Nguoc voi `toDateKey`, tra 00:00 cua ngay do. Sai dinh dang hoac ngay khong ton tai thi tra null. */
export function parseDateKey(key: string): Date | null {
  const match = DATE_KEY_PATTERN.exec(key);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  // `new Date` tu day ngay tran sang thang sau (vd 31/02 -> 03/03) thay vi bao loi
  return toDateKey(date) === key ? date : null;
}
