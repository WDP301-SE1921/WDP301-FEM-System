import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getInitials } from '@/utils/format';

import type { InvitationPreview } from '../types';
import { formatLinkCode } from '../utils';

const STATUS_ICON_SIZE = 16;
const AVATAR_SIZE = 56;
const AVATAR_BADGE_SIZE = 20;
const AVATAR_BADGE_ICON_SIZE = 12;
const AVATAR_BADGE_BORDER_WIDTH = 2;
const SUBJECT_DOT_SIZE = 6;

export type LinkedStudentCardProps = {
  invitation: InvitationPreview;
  /** Ma vua kiem tra, hien lai de phu huynh doi chieu voi email. */
  code: string;
};

/**
 * The hoc sinh ma lien ket tro toi, de phu huynh xac nhan dung con, dung lop truoc khi dung ma.
 * Inspect (§6.3) chi tra ten, mon, lop: chua co khoi, lich hoc hay anh dai dien.
 */
export function LinkedStudentCard({ invitation, code }: LinkedStudentCardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.status}>
          <Icon name="checkmark-circle" size={STATUS_ICON_SIZE} themeColor="success" />
          <ThemedText type="smallBold" themeColor="success" numberOfLines={1} style={styles.shrink}>
            Đã xác thực hồ sơ học sinh
          </ThemedText>
        </View>
        <ThemedView style={styles.chip}>
          <ThemedText type="small" themeColor="textSecondary">
            Mã: {formatLinkCode(code)}
          </ThemedText>
        </ThemedView>
      </View>

      <View style={styles.student}>
        <View>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText type="heading" themeColor="primaryText">
              {getInitials(invitation.studentName)}
            </ThemedText>
          </View>
          <View
            style={[
              styles.avatarBadge,
              { backgroundColor: theme.success, borderColor: theme.backgroundElement },
            ]}
          >
            <Icon name="checkmark" size={AVATAR_BADGE_ICON_SIZE} themeColor="primaryText" />
          </View>
        </View>

        <View style={styles.details}>
          <ThemedText type="default" numberOfLines={1} style={styles.name}>
            {invitation.studentName}
          </ThemedText>
          <View style={styles.classRow}>
            <ThemedView style={styles.chip}>
              <View style={[styles.subjectDot, { backgroundColor: theme.primary }]} />
              <ThemedText type="smallBold" themeColor="primary">
                {invitation.subjectName}
              </ThemedText>
            </ThemedView>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={1}
              style={styles.shrink}
            >
              Lớp {invitation.className}
            </ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  status: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
  },
  student: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: -Spacing.half,
    bottom: -Spacing.half,
    width: AVATAR_BADGE_SIZE,
    height: AVATAR_BADGE_SIZE,
    borderRadius: Radius.full,
    borderWidth: AVATAR_BADGE_BORDER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1, gap: Spacing.one },
  name: { fontWeight: 700 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  subjectDot: { width: SUBJECT_DOT_SIZE, height: SUBJECT_DOT_SIZE, borderRadius: Radius.full },
  shrink: { flexShrink: 1 },
});
