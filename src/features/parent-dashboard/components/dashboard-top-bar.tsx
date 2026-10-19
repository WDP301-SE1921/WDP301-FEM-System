import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Images } from '@/constants/images';
import { Radius, Spacing } from '@/constants/theme';
import { getInitials } from '@/utils/format';

import type { LinkedStudent } from '../types';

const LOGO_SIZE = 32;
const AVATAR_SIZE = 36;
/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;

export type DashboardTopBarProps = {
  /** Con dang xem. Chua co con (dang tai, loi, chua lien ket) thi an nut chon con. */
  student: LinkedStudent | undefined;
  onPressStudent: () => void;
};

/** Thanh tren cung: logo, ten man hinh va avatar con dang xem, bam de mo danh sach chon con. */
export function DashboardTopBar({ student, onPressStudent }: DashboardTopBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image
          source={Images.logo}
          style={styles.logo}
          contentFit="cover"
          accessibilityLabel="Logo EduGrade"
        />
        <ThemedText type="default" numberOfLines={1} style={styles.title}>
          Trang chủ
        </ThemedText>
      </View>

      {student ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chọn học sinh, đang xem ${student.fullName}`}
          onPress={onPressStudent}
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
        >
          <ThemedView type="primary" style={styles.avatar}>
            <ThemedText type="smallBold" themeColor="primaryText">
              {getInitials(student.fullName)}
            </ThemedText>
          </ThemedView>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    minHeight: TOUCH_TARGET_SIZE,
  },
  brand: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: Radius.full },
  title: { flexShrink: 1, fontWeight: 700 },
  avatarButton: {
    width: TOUCH_TARGET_SIZE,
    height: TOUCH_TARGET_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
