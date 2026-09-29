import { Fragment, useState, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Fonts, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { LINK_CODE_GROUP_SIZE, LINK_CODE_LENGTH } from '../constants';
import { normalizeLinkCode } from '../utils';

const BOX_HEIGHT = 56;
const BOX_MAX_WIDTH = 44;
const BOX_GAP = Spacing.one;
const BOX_BORDER_WIDTH = 1.5;
const GROUP_MAX_WIDTH = LINK_CODE_GROUP_SIZE * BOX_MAX_WIDTH + (LINK_CODE_GROUP_SIZE - 1) * BOX_GAP;
const EMPTY_DOT_SIZE = 8;
const CARET_WIDTH = 16;
const CARET_HEIGHT = 2;
const DIVIDER_WIDTH = 10;
const DIVIDER_HEIGHT = 2;
/** Gan 0 nhung khac 0: Android bo qua cham vao view co opacity 0, mat menu dan cua he thong. */
const HIDDEN_INPUT_OPACITY = 0.01;

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, offset) => start + offset);
}

/** Chi so cac o theo nhom, vd [[0,1,2,3],[4,5,6,7]]. */
const BOX_GROUPS = range(0, Math.ceil(LINK_CODE_LENGTH / LINK_CODE_GROUP_SIZE)).map((group) => {
  const start = group * LINK_CODE_GROUP_SIZE;
  return range(start, Math.min(start + LINK_CODE_GROUP_SIZE, LINK_CODE_LENGTH));
});

export type LinkCodeFieldProps = Pick<TextInputProps, 'onBlur' | 'onSubmitEditing'> & {
  value: string;
  /** Nhan ma da chuan hoa (in hoa, bo ky tu la, dung do dai). */
  onChangeText: (code: string) => void;
  error?: string;
  ref?: Ref<TextInput>;
};

/**
 * O nhap ma chia tung o. Mot TextInput that phu len cac o nen go, dan (nhan giu) va
 * trinh doc man hinh deu chay nhu o nhap thuong; cac o chi de hien thi.
 */
export function LinkCodeField({
  value,
  onChangeText,
  onBlur,
  onSubmitEditing,
  error,
  ref,
}: LinkCodeFieldProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const activeIndex = isFocused ? Math.min(value.length, LINK_CODE_LENGTH - 1) : -1;

  return (
    <View style={styles.wrapper}>
      <View>
        <View
          style={styles.row}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {BOX_GROUPS.map((group, groupIndex) => (
            <Fragment key={groupIndex}>
              {groupIndex > 0 ? (
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
              ) : null}
              <View style={styles.group}>
                {group.map((index) => (
                  <CodeBox
                    key={index}
                    character={value[index]}
                    isActive={index === activeIndex}
                    hasError={Boolean(error)}
                  />
                ))}
              </View>
            </Fragment>
          ))}
        </View>

        <TextInput
          ref={ref}
          value={value}
          onChangeText={(text) => onChangeText(normalizeLinkCode(text))}
          onFocus={() => setIsFocused(true)}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel="Mã liên kết"
          accessibilityHint={`Nhập ${LINK_CODE_LENGTH} ký tự trong email từ trung tâm`}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="done"
          caretHidden
          style={[StyleSheet.absoluteFill, styles.hiddenInput]}
        />
      </View>

      {error ? (
        <ThemedText type="small" themeColor="danger" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

type CodeBoxProps = {
  character: string | undefined;
  isActive: boolean;
  hasError: boolean;
};

function getBoxBorderColor({ isActive, hasError }: Omit<CodeBoxProps, 'character'>): ThemeColor {
  if (hasError) return 'danger';
  if (isActive) return 'primary';
  return 'border';
}

function CodeBox({ character, isActive, hasError }: CodeBoxProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.box,
        {
          borderColor: theme[getBoxBorderColor({ isActive, hasError })],
          backgroundColor: isActive ? theme.background : theme.backgroundElement,
        },
      ]}
    >
      <CodeBoxContent character={character} isActive={isActive} />
    </View>
  );
}

/** O da co ky tu hien ky tu, o dang nhap hien con tro, o trong hien cham mo. */
function CodeBoxContent({ character, isActive }: Omit<CodeBoxProps, 'hasError'>) {
  const theme = useTheme();

  if (character) {
    return (
      <ThemedText type="heading" themeColor="primary" style={styles.character}>
        {character}
      </ThemedText>
    );
  }
  if (isActive) return <View style={[styles.caret, { backgroundColor: theme.primary }]} />;
  return <View style={[styles.emptyDot, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  group: {
    flex: 1,
    maxWidth: GROUP_MAX_WIDTH,
    flexDirection: 'row',
    gap: BOX_GAP,
  },
  divider: {
    width: DIVIDER_WIDTH,
    height: DIVIDER_HEIGHT,
    borderRadius: Radius.full,
    marginHorizontal: Spacing.one,
  },
  box: {
    flex: 1,
    height: BOX_HEIGHT,
    borderWidth: BOX_BORDER_WIDTH,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  character: { fontFamily: Fonts.mono },
  emptyDot: { width: EMPTY_DOT_SIZE, height: EMPTY_DOT_SIZE, borderRadius: Radius.full },
  caret: {
    position: 'absolute',
    bottom: Spacing.three,
    width: CARET_WIDTH,
    height: CARET_HEIGHT,
    borderRadius: Radius.full,
  },
  hiddenInput: { opacity: HIDDEN_INPUT_OPACITY },
  error: { textAlign: 'center' },
});
