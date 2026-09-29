import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';

import { INVITATION_EMAIL_SUBJECT } from '../constants';

const ICON_BOX_SIZE = 40;
const ICON_SIZE = 20;
const SEARCH_ICON_SIZE = 14;

/** Goi y tim email chua ma: kiem tra ca thu muc Spam va tim theo tieu de email. */
export function FindCodeTip() {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView style={styles.iconBox}>
        <Icon name="mail-unread" size={ICON_SIZE} themeColor="accent" />
      </ThemedView>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold">Mẹo tìm mã nhanh</ThemedText>
          <ThemedView style={styles.tag}>
            <ThemedText type="small" themeColor="accent">
              Gợi ý
            </ThemedText>
          </ThemedView>
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          Vui lòng kiểm tra hộp thư đến hoặc thư mục{' '}
          <ThemedText type="smallBold">Spam / Thư rác</ThemedText> với tiêu đề:
        </ThemedText>

        <ThemedView style={styles.subject}>
          <Icon name="search" size={SEARCH_ICON_SIZE} themeColor="primary" />
          <ThemedText type="smallBold" themeColor="primary" numberOfLines={1} style={styles.flex}>
            {INVITATION_EMAIL_SUBJECT}
          </ThemedText>
        </ThemedView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  iconBox: {
    width: ICON_BOX_SIZE,
    height: ICON_BOX_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: Spacing.one },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tag: { paddingHorizontal: Spacing.two, borderRadius: Radius.full },
  subject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.control,
  },
  flex: { flex: 1 },
});
