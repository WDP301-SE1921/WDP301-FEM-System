import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const TOUCH_TARGET_SIZE = 44;
const BOX_SIZE = 22;
const BOX_BORDER_WIDTH = 2;
const CHECK_ICON_SIZE = 16;

export type TermsCheckboxProps = {
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  error?: string;
};

function getBoxBorderColor({
  isChecked,
  hasError,
}: {
  isChecked: boolean;
  hasError: boolean;
}): ThemeColor {
  if (hasError) return 'danger';
  if (isChecked) return 'primary';
  return 'border';
}

/** O dong y dieu khoan. Ca dong chu la vung cham, khong chi rieng o vuong. */
export function TermsCheckbox({ isChecked, onChange, error }: TermsCheckboxProps) {
  const theme = useTheme();
  const borderColor = theme[getBoxBorderColor({ isChecked, hasError: Boolean(error) })];

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
        onPress={() => onChange(!isChecked)}
        style={styles.row}
      >
        <View
          style={[
            styles.box,
            { borderColor, backgroundColor: isChecked ? theme.primary : theme.background },
          ]}
        >
          {isChecked ? (
            <Icon name="checkmark" size={CHECK_ICON_SIZE} themeColor="primaryText" />
          ) : null}
        </View>
        {/* Chua co trang dieu khoan va chinh sach: co URL thi doi hai cum nay thanh link */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          Tôi đồng ý với <ThemedText type="smallBold">Điều khoản dịch vụ</ThemedText> và{' '}
          <ThemedText type="smallBold">Chính sách bảo mật</ThemedText> của EduGrade
        </ThemedText>
      </Pressable>

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  row: {
    minHeight: TOUCH_TARGET_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: BOX_BORDER_WIDTH,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
});
