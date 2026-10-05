import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BAR_HEIGHT = 12;
const MARKER_SIZE = 8;
const PERCENT_MAX = 100;

export type RoadmapProgressBarProps = {
  /** Phan tram bai da hoc, 0-100. */
  percent: number;
  /** Vi tri (phan tram) cuoi moi bai kiem tra dinh ky. */
  markers: readonly { id: string; percent: number }[];
};

/** Thanh tien do lo trinh, cham mau nhan danh dau cac bai kiem tra dinh ky. */
export function RoadmapProgressBar({ percent, markers }: RoadmapProgressBarProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Tiến độ lộ trình"
      accessibilityValue={{ min: 0, max: PERCENT_MAX, now: percent }}
      style={[styles.track, { backgroundColor: theme.backgroundSelected }]}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: theme.primary }]} />
      {markers.map((marker) => (
        <View
          key={marker.id}
          style={[
            styles.marker,
            {
              left: `${marker.percent}%`,
              backgroundColor: theme.accent,
              borderColor: theme.background,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: BAR_HEIGHT, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
  marker: {
    position: 'absolute',
    top: (BAR_HEIGHT - MARKER_SIZE) / 2,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    // Cham ket thuc dung tai vi tri cuoi bai kiem tra nen khong tran ra ngoai thanh o moc 100%
    marginLeft: -MARKER_SIZE,
    borderWidth: 1,
    borderRadius: Radius.full,
  },
});
