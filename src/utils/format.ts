/** Ham format dung chung cho toan app. */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const DAYS_PER_WEEK = 7;
/** Theo thu tu cua `Date.getDay()`, bat dau tu Chu nhat. */
const WEEKDAY_NAMES = [
  'Chủ nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const;
/** Cach ghi thu ngan tren lich, cung thu tu voi `WEEKDAY_NAMES`. */
const SHORT_WEEKDAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;

function toValidDate(value: string | Date): Date | null {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

function padTwoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatCurrency(value: number, currency = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/** Gio phut theo gio cua may, vd `18:00`. */
export function formatTime(value: string | Date): string {
  const date = toValidDate(value);
  if (!date) return '--';
  return `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;
}

/** Ngay va thang, vd `16/10`. */
export function formatDayMonth(value: string | Date): string {
  const date = toValidDate(value);
  if (!date) return '--';
  return `${padTwoDigits(date.getDate())}/${padTwoDigits(date.getMonth() + 1)}`;
}

/** Thu va ngay thang, vd `Thứ Hai 16/10`. */
export function formatWeekdayDate(value: string | Date): string {
  const date = toValidDate(value);
  if (!date) return '--';
  const weekday = WEEKDAY_NAMES[date.getDay()] ?? '';
  return `${weekday} ${formatDayMonth(date)}`;
}

/** Thu viet tat tren lich, vd `T2`, `CN`. */
export function formatShortWeekday(value: string | Date): string {
  const date = toValidDate(value);
  if (!date) return '--';
  return SHORT_WEEKDAY_NAMES[date.getDay()] ?? '--';
}

/** Thoi gian da qua so voi `now`, vd `2 giờ trước`, `Hôm qua`. Qua mot tuan thi hien ngay. */
export function formatRelativeTime(value: string | Date, now: Date = new Date()): string {
  const date = toValidDate(value);
  if (!date) return '--';

  const elapsedMs = now.getTime() - date.getTime();
  if (elapsedMs < MINUTE_MS) return 'Vừa xong';
  if (elapsedMs < HOUR_MS) return `${Math.floor(elapsedMs / MINUTE_MS)} phút trước`;
  if (elapsedMs < DAY_MS) return `${Math.floor(elapsedMs / HOUR_MS)} giờ trước`;

  const days = Math.floor(elapsedMs / DAY_MS);
  if (days === 1) return 'Hôm qua';
  if (days < DAYS_PER_WEEK) return `${days} ngày trước`;
  return formatDate(date);
}

export function truncate(text: string, maxLength = 80): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/** Lay chu cai dau cho avatar placeholder. */
export function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Lay `wordCount` tu cuoi cua ho ten tieng Viet, vd `Nguyễn Minh Anh` -> `Minh Anh`. */
export function getShortName(fullName: string, wordCount = 2): string {
  return fullName.trim().split(/\s+/).slice(-wordCount).join(' ');
}
