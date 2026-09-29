import type { IconName } from '@/components/ui/icon';
import type { ThemeColor } from '@/constants/theme';

import type { DayPeriod, ScheduleSessionType, SessionStatus } from './types';

/** Cap mau cua mot sac thai: mau chinh cho chu/icon, mau nhat cho nen chip va icon tron. */
export const TONES = {
  primary: { color: 'primary', soft: 'primarySoft' },
  accent: { color: 'accent', soft: 'accentSoft' },
  success: { color: 'success', soft: 'successSoft' },
  danger: { color: 'danger', soft: 'dangerSoft' },
  neutral: { color: 'textSecondary', soft: 'backgroundSelected' },
} as const satisfies Record<string, { color: ThemeColor; soft: ThemeColor }>;

export type Tone = keyof typeof TONES;

export type ScoreLevel = { label: string; tone: Tone };

/**
 * Xep loai diem trung binh theo muc cua Thong tu 22/2021 (THCS, thang diem 10), sap tu cao xuong
 * thap. Trung tam chua chot cach xep loai: doi nguong o day.
 */
export const SCORE_LEVELS = [
  { minScore: 8, label: 'Tốt', tone: 'success' },
  { minScore: 6.5, label: 'Khá', tone: 'primary' },
  { minScore: 5, label: 'Đạt', tone: 'accent' },
] as const satisfies readonly (ScoreLevel & { minScore: number })[];

/** Diem duoi nguong thap nhat cua `SCORE_LEVELS`. */
export const FAILING_SCORE_LEVEL: ScoreLevel = { label: 'Chưa đạt', tone: 'danger' };

export const SESSION_STATUSES: Record<SessionStatus, { label: string; tone: Tone }> = {
  UPCOMING: { label: 'Sắp diễn ra', tone: 'primary' },
  IN_PROGRESS: { label: 'Đang diễn ra', tone: 'success' },
  FINISHED: { label: 'Đã kết thúc', tone: 'neutral' },
};

type SessionTypeAppearance = {
  /** Mau vach ben trai the, icon gio va khung ghi chu. */
  tone: Tone;
  /** Nhan hien thay trang thai buoi hoc. Buoi co dinh khong co nhan rieng. */
  badge: { label: string; icon: IconName } | null;
  noteIcon: IconName;
};

export const SESSION_TYPES: Record<ScheduleSessionType, SessionTypeAppearance> = {
  REGULAR: { tone: 'primary', badge: null, noteIcon: 'information-circle-outline' },
  MAKEUP: {
    tone: 'primary',
    badge: { label: 'Học bù', icon: 'swap-horizontal' },
    noteIcon: 'information-circle-outline',
  },
  RESCHEDULED: {
    tone: 'accent',
    badge: { label: 'Đổi lịch', icon: 'repeat' },
    noteIcon: 'megaphone-outline',
  },
};

export const DAY_PERIOD_LABELS: Record<DayPeriod, string> = {
  MORNING: 'Sáng',
  AFTERNOON: 'Chiều',
  EVENING: 'Tối',
};

/** Pham vi chon tuan cua lich hoc, tinh tu tuan hien tai. */
export const WEEKS_BEFORE = 2;
export const WEEKS_AFTER = 4;
