import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormInput } from '@/components/common/form-input';
import { Button } from '@/components/ui/button';

const schema = z.object({ email: z.string().min(1, 'Vui lòng nhập email') });
type Values = z.infer<typeof schema>;

function TestForm({ onValid }: { onValid: (values: Values) => void }) {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  return (
    <>
      <FormInput control={control} name="email" label="Email" />
      <Button title="Gửi" onPress={handleSubmit(onValid)} />
    </>
  );
}

describe('components/common/FormInput', () => {
  it('hien loi validate va khong submit khi o nhap trong', async () => {
    const user = userEvent.setup();
    const onValid = jest.fn();
    await render(<TestForm onValid={onValid} />);

    await user.press(screen.getByRole('button', { name: 'Gửi' }));

    expect(await screen.findByText('Vui lòng nhập email')).toBeOnTheScreen();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('dua gia tri nguoi dung nhap vao form', async () => {
    const user = userEvent.setup();
    const onValid = jest.fn();
    await render(<TestForm onValid={onValid} />);

    await user.type(screen.getByLabelText('Email'), 'a@b.vn');
    await user.press(screen.getByRole('button', { name: 'Gửi' }));

    await waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
    expect(onValid.mock.calls[0]?.[0]).toEqual({ email: 'a@b.vn' });
  });
});
