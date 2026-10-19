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
  onChange: (answer: string) => void;
};

/** Mot cau khi con lam bai: cau trac nghiem chon mot lua chon, cau tu luan nhap bai lam. */
export function QuestionAnswerCard({
  position,
  question,
  value,
  onChange,
}: QuestionAnswerCardProps) {
  const label = `Câu ${position}`;

  return (
    <QuestionFrame
      position={position}
      prompt={question.prompt}
      points={formatPoints(question.maxScore)}
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
        <Input
          label={`Bài làm câu ${position}`}
          placeholder="Nhập bài làm của học sinh"
          multiline
          maxLength={ESSAY_MAX_LENGTH}
          value={value}
          onChangeText={onChange}
          style={styles.essay}
        />
      )}
    </QuestionFrame>
  );
}

const styles = StyleSheet.create({
  choices: { gap: Spacing.two },
  essay: { minHeight: ESSAY_MIN_HEIGHT, textAlignVertical: 'top' },
});
