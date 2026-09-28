import { Controller, type Control, type FieldPathByValue, type FieldValues } from 'react-hook-form';

import { Input, type InputProps } from '@/components/ui/input';

export type FormInputProps<TValues extends FieldValues> = Omit<
  InputProps,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'
> & {
  control: Control<TValues>;
  /** Chi nhan field kieu string cua form. */
  name: FieldPathByValue<TValues, string>;
};

/** O nhap noi san voi react-hook-form: tu gan value, onChange, onBlur, ref va hien loi validate. */
export function FormInput<TValues extends FieldValues>({
  control,
  name,
  ...inputProps
}: FormInputProps<TValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        // `name` da gioi han o field kieu string, nhung TS khong tu thu hep kieu value trong generic
        const value = field.value as string;

        return (
          <Input
            {...inputProps}
            ref={field.ref}
            value={value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        );
      }}
    />
  );
}
