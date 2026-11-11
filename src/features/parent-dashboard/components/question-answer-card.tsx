import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Spacing } from '@/constants/theme';

import type { AssignmentQuestion } from '../types';
import { formatPoints } from '../utils';

import { ChoiceOption } from './choice-option';
import { QuestionFrame } from './question-frame';

/** Du cho vai dong bai lam truoc khi o nhap tu cao len. */
const ESSAY_MIN_HEIGHT = 120;
/** Gioi han `answer` cua AnswerDto o BE. */
const ESSAY_MAX_LENGTH = 20000;

export type QuestionAnswerCardProps = {
  /** Thu tu cau trong de, tinh tu 1. */
  position: number;
  question: AssignmentQuestion;
  /** Cau tra loi dang lam, chuoi rong khi chua lam. */
  value: string;
  /** Con da bam nop ma cau nay con trong. */
  isMissing: boolean;
  /** Ma CLO cau nay do, xem `getQuestionOutcomeCodes`. */
  outcomeCode?: string;
  onChange: (answer: string) => void;
  /** Khu anh/file bai lam rieng cua cau tu luan, hien duoi o nhap bai lam. */
  attachments?: ReactNode;
};

/** Mot cau khi con lam bai: cau trac nghiem chon mot lua chon, cau tu luan nhap bai lam. */
export function QuestionAnswerCard({
  position,
  question,
  value,
  isMissing,
  outcomeCode,
  onChange,
  attachments,
}: QuestionAnswerCardProps) {
  const label = `Câu ${position}`;

  return (
    <QuestionFrame
      position={position}
      prompt={question.prompt}
      points={formatPoints(question.maxScore)}
      isMissing={isMissing}
      outcomeCode={outcomeCode}
    >
      {question.choices ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.choices}>
          {question.choices.map((choice) => (
            <ChoiceOption
              key={choice}
              label={choice}
              state={choice === value ? 'SELECTED' : 'IDLE'}
              onPress={() => onChange(choice)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.essayGroup}>
          <Input
            label={`Bài làm câu ${position}`}
            placeholder="Gõ bài làm vào đây"
            multiline
            maxLength={ESSAY_MAX_LENGTH}
            value={value}
            onChangeText={onChange}
            style={styles.essay}
          />
          {attachments}
        </View>
      )}
    </QuestionFrame>
  );
}

const styles = StyleSheet.create({
  choices: { gap: Spacing.two },
  essayGroup: { gap: Spacing.three },
  essay: { minHeight: ESSAY_MIN_HEIGHT, textAlignVertical: 'top' },
});
