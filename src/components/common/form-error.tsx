import { ThemedText } from '@/components/ui/themed-text';
import { getErrorMessage } from '@/utils/error';

export type FormErrorProps = {
  /** Loi khi submit (thuong la `mutation.error`). Khong co loi thi khong render gi. */
  error: unknown;
};

/** Loi chung cua ca form, thuong den tu server. Loi tung o nhap do `FormInput` tu hien. */
export function FormError({ error }: FormErrorProps) {
  if (!error) return null;

  return (
    <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
      {getErrorMessage(error)}
    </ThemedText>
  );
}
