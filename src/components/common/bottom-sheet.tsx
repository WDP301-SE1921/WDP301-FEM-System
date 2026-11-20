import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Vung cham toi thieu 44x44 (design-mobile.md). */
const CLOSE_BUTTON_SIZE = 44;
const CLOSE_ICON_SIZE = 20;
const HANDLE_WIDTH = 48;
const HANDLE_HEIGHT = 6;
/** Chua lai mot khoang phia tren de nguoi dung thay day la sheet, bam ra ngoai de dong. */
const SHEET_MAX_HEIGHT = '85%';
const BOTTOM_EDGE: readonly Edge[] = ['bottom'];
const NO_EDGE: readonly Edge[] = [];
/** iOS bao truoc khi ban phim chay len, de sheet nang cung luc; Android chi bao sau khi ban phim da hien. */
const KEYBOARD_SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const KEYBOARD_HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

function useIsKeyboardVisible() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const subscriptions = [
      Keyboard.addListener(KEYBOARD_SHOW_EVENT, () => setIsVisible(true)),
      Keyboard.addListener(KEYBOARD_HIDE_EVENT, () => setIsVisible(false)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return isVisible;
}

export type BottomSheetProps = PropsWithChildren<{
  isVisible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
}>;

/**
 * Sheet truot tu duoi len: tieu de, nut dong, noi dung ben duoi. Bam lop phu cung dong sheet. Tu nang
 * len tren ban phim khi go vao o nhap trong sheet. Noi dung co o nhap thi noi dung sheet tu boc trong
 * `ScrollView` (`keyboardShouldPersistTaps="handled"` de bam nut ngay lan dau khi ban phim dang mo),
 * vi phan man hinh con lai tren ban phim co the thap hon noi dung.
 */
export function BottomSheet({ isVisible, title, subtitle, onClose, children }: BottomSheetProps) {
  const theme = useTheme();
  // Ban phim da che thanh dieu huong: giu safe area duoi thi sheet ho mot khoang trong tren ban phim
  const isKeyboardVisible = useIsKeyboardVisible();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      // Android: ve ca duoi thanh dieu huong, khong thi lo mot dai den duoi sheet (iOS da ve sat mep);
      // safe area ben trong sheet tu chua cho thanh dieu huong
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {/*
        Modal ve tran vien nen cua so cua no khong tu co lai khi ban phim mo (iOS va Android): tu
        day sheet len. Modal phu ca man hinh tu mep tren nen phep tinh cua KeyboardAvoidingView dung.
      */}
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        {/* Nguoi dung trinh doc man hinh dong bang nut "Đóng" nen lop phu khong can focus */}
        <Pressable
          accessible={false}
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]}
        />

        <ThemedView accessibilityViewIsModal style={styles.sheet}>
          <SafeAreaView edges={isKeyboardVisible ? NO_EDGE : BOTTOM_EDGE} style={styles.safeArea}>
            <View style={[styles.handle, { backgroundColor: theme.backgroundSelected }]} />

            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View style={styles.titleBlock}>
                <ThemedText type="heading" accessibilityRole="header">
                  {title}
                </ThemedText>
                {subtitle ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}
              >
                <Icon name="close" size={CLOSE_ICON_SIZE} />
              </Pressable>
            </View>

            {children}
          </SafeAreaView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: SHEET_MAX_HEIGHT,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
  },
  safeArea: { flexShrink: 1, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  handle: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginVertical: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleBlock: { flex: 1, gap: Spacing.half },
  closeButton: {
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
