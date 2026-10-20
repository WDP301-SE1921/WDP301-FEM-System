import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import type { EnrollmentPause, SessionLink, StudentEnrollment } from '../types';
import { formatDateKey, formatNextSession } from '../utils';

const ICON_SIZE = 16;
/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;

export type CourseFooterProps = {
  enrollment: StudentEnrollment;
  onOpenSession: (session: SessionLink) => void;
};

/** Dong cuoi the mon hoc: buoi tiep theo, don bao luu hoac ngay ket thuc tuy trang thai. */
export function CourseFooter({ enrollment, onOpenSession }: CourseFooterProps) {
  if (enrollment.status === 'ENDED') {
    return enrollment.endDate ? (
      <ThemedText type="small" themeColor="textSecondary">
        Kết thúc ngày {formatDateKey(enrollment.endDate)}
      </ThemedText>
    ) : null;
  }
  if (enrollment.pause) return <PauseNotice pause={enrollment.pause} />;
  if (!enrollment.nextSession) return null;

  const { nextSession } = enrollment;
  const nextSessionLabel = formatNextSession(nextSession.startsAt);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buổi tiếp theo: ${nextSessionLabel}`}
      accessibilityHint="Xem chi tiết buổi học"
      onPress={() => onOpenSession(nextSession)}
      style={({ pressed }) => [styles.nextSession, pressed && styles.pressed]}
    >
      <Icon name="calendar-outline" size={ICON_SIZE} themeColor="primary" />
      <ThemedText type="small" style={styles.nextSessionText}>
        Buổi tiếp theo: <ThemedText type="smallBold">{nextSessionLabel}</ThemedText>
      </ThemedText>
      <Icon name="chevron-forward" size={ICON_SIZE} themeColor="primary" />
    </Pressable>
  );
}

function PauseNotice({ pause }: { pause: EnrollmentPause }) {
  return (
    <ThemedView type="accentSoft" style={styles.pause}>
      <Icon name="pause-circle" size={ICON_SIZE} themeColor="accent" />
      <ThemedText type="small" style={styles.pauseText}>
        Tạm nghỉ từ <ThemedText type="smallBold">{formatDateKey(pause.fromDate)}</ThemedText> đến
        hết <ThemedText type="smallBold">{formatDateKey(pause.toDate)}</ThemedText>
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  nextSession: {
    minHeight: TOUCH_TARGET_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressed: { opacity: 0.75 },
  nextSessionText: { flex: 1 },
  pause: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.control,
  },
  pauseText: { flex: 1 },
});
