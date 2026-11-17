import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatTime, formatWeekdayDate } from '@/utils/format';

import { SESSION_LEAVE_STATUSES, TONES } from '../constants';
import { useRequestSessionLeave, useSessionLeave } from '../hooks/use-session-leave';
import type { SessionDetail } from '../types';

import { SessionLeaveSheet } from './session-leave-sheet';
import { ToneIcon } from './tone-icon';

export type SessionLeaveCardProps = {
  studentId: string;
  session: SessionDetail;
};

/**
 * Xin nghi mot buoi tu chi tiet buoi hoc: buoi chua dien ra thi co nut "Xin nghỉ buổi này", da gui
 * don thi hien trang thai don. Nghi dai han (bao luu) van lam tai quay.
 */
export function SessionLeaveCard({ studentId, session }: SessionLeaveCardProps) {
  const ref = { studentId, sessionId: session.id };
  const leave = useSessionLeave(ref, session.startsAt);
  const request = useRequestSessionLeave(ref);
  const [isSheetOpen, setSheetOpen] = useState(false);

  const isUpcoming = session.status === 'SCHEDULED' && new Date(session.startsAt) > new Date();
  const current = leave.data ?? null;
  const status = current && current.status !== 'CANCELLED' ? current.status : null;
  const canRequest = isUpcoming && (status === null || status === 'REJECTED');
  if (leave.isPending || (!status && !canRequest)) return null;

  const appearance = status ? SESSION_LEAVE_STATUSES[status] : null;
  const closeSheet = () => {
    setSheetOpen(false);
    request.reset();
  };

  return (
    <View style={styles.container}>
      {appearance ? (
        <ThemedView type={TONES[appearance.tone].soft} style={styles.card}>
          {appearance.icon ? (
            <ToneIcon name={appearance.icon} tone={appearance.tone} variant="solid" />
          ) : null}
          <View style={styles.content}>
            <ThemedText type="smallBold" themeColor={TONES[appearance.tone].text}>
              {appearance.label}
            </ThemedText>
            <ThemedText type="small">{appearance.note}</ThemedText>
          </View>
        </ThemedView>
      ) : null}
      {canRequest ? (
        <Button
          title={status === 'REJECTED' ? 'Gửi lại đơn xin nghỉ' : 'Xin nghỉ buổi này'}
          icon="document-text-outline"
          variant="secondary"
          onPress={() => setSheetOpen(true)}
          style={styles.pill}
        />
      ) : null}
      <SessionLeaveSheet
        isVisible={isSheetOpen}
        sessionLabel={`${formatWeekdayDate(session.startsAt)} · ${formatTime(session.startsAt)}`}
        isPending={request.isPending}
        error={request.error}
        onSubmit={(reason) => request.mutate(reason, { onSuccess: closeSheet })}
        onClose={closeSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  content: { flex: 1, gap: Spacing.half },
  pill: { borderRadius: Radius.full },
});
