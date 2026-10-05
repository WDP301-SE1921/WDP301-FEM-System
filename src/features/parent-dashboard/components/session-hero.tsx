import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatWeekdayDate } from '@/utils/format';

import type { LinkedStudent, SessionDetail } from '../types';
import { getSessionDetailStatus } from '../utils';

import { ToneBadge } from './tone-badge';

const CHIP_ICON_SIZE = 14;
const LARGE_GLOW_SIZE = 144;
const SMALL_GLOW_SIZE = 112;
/** Hinh tron trang tri tran mot phan ra ngoai khoi hero. */
const GLOW_OFFSET = -32;
const ACCENT_GLOW_OPACITY = 0.35;

export type SessionHeroProps = {
  session: SessionDetail;
  /** Con dang xem. Danh sach con chua tai xong thi an dong ten hoc sinh. */
  student: LinkedStudent | undefined;
};

/** Khoi dau man chi tiet: trang thai, ngay hoc, lop, ten bai va con dang xem. */
export function SessionHero({ session, student }: SessionHeroProps) {
  const theme = useTheme();
  const status = getSessionDetailStatus(session);
  const headline = session.lesson?.title ?? session.topic ?? `Buổi học ${session.subjectName}`;

  return (
    <ThemedView type="primary" style={styles.hero}>
      <View style={[styles.glow, styles.largeGlow, { backgroundColor: theme.primaryOverlay }]} />
      <View style={[styles.glow, styles.smallGlow, { backgroundColor: theme.accent }]} />

      <View style={styles.statusRow}>
        <ToneBadge label={status.label} tone={status.tone} icon={status.icon} />
        <HeroChip icon="calendar-outline" label={formatWeekdayDate(session.startsAt)} />
      </View>

      <View style={styles.titleBlock}>
        <HeroChip label={session.className} />
        <ThemedText type="heading" themeColor="primaryText">
          {headline}
        </ThemedText>
      </View>

      {student ? (
        <HeroChip
          icon="school-outline"
          label={`Học sinh: ${student.fullName} · Khối ${student.grade}`}
        />
      ) : null}
    </ThemedView>
  );
}

type HeroChipProps = {
  label: string;
  icon?: IconName;
};

function HeroChip({ label, icon }: HeroChipProps) {
  return (
    <ThemedView type="primaryOverlay" style={styles.chip}>
      {icon ? <Icon name={icon} size={CHIP_ICON_SIZE} themeColor="primaryText" /> : null}
      <ThemedText type="small" themeColor="primaryText" numberOfLines={1} style={styles.chipText}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  glow: { position: 'absolute', borderRadius: Radius.full },
  largeGlow: {
    top: GLOW_OFFSET,
    right: GLOW_OFFSET,
    width: LARGE_GLOW_SIZE,
    height: LARGE_GLOW_SIZE,
  },
  smallGlow: {
    bottom: GLOW_OFFSET,
    left: GLOW_OFFSET,
    width: SMALL_GLOW_SIZE,
    height: SMALL_GLOW_SIZE,
    opacity: ACCENT_GLOW_OPACITY,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleBlock: { alignItems: 'flex-start', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
  },
  chipText: { flexShrink: 1 },
});
