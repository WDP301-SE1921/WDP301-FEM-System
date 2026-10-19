import { useState } from 'react';
import type { FieldValues } from 'react-hook-form';

import { FormInput, type FormInputProps } from './form-input';
import { PasswordVisibilityToggle } from './password-visibility-toggle';

export type FormPasswordInputProps<TValues extends FieldValues> = Omit<
  FormInputProps<TValues>,
  'secureTextEntry' | 'trailing'
>;

/** O mat khau noi voi react-hook-form, kem nut con mat de xem lai mat khau vua go. */
export function FormPasswordInput<TValues extends FieldValues>(
  props: FormPasswordInputProps<TValues>,
) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormInput
      {...props}
      secureTextEntry={!isVisible}
      trailing={
        <PasswordVisibilityToggle
          isVisible={isVisible}
          onToggle={() => setIsVisible((visible) => !visible)}
        />
      }
    />
  );
}
