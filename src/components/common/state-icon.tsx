import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CIRCLE_SIZE = 72;
const ICON_SIZE = 32;

/** Mau nen va mau icon cua tung sac thai. */
const TONES = {
  primary: { background: 'primarySoft', icon: 'primary' },
  danger: { background: 'dangerSoft', icon: 'danger' },
} as const;

export type StateIconProps = {
  name: IconName;
  tone?: keyof typeof TONES;
};

/** Icon tron nen nhat dau man hinh trang thai (rong, loi), de man hinh khong chi co chu. */
export function StateIcon({ name, tone = 'primary' }: StateIconProps) {
  const theme = useTheme();
  const { background, icon } = TONES[tone];

  return (
    <View style={[styles.circle, { backgroundColor: theme[background] }]}>
      <Icon name={name} size={ICON_SIZE} themeColor={icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
