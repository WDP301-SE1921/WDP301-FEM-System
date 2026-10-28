import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { TabHeader } from '@/components/common/tab-header';

describe('components/common/TabHeader', () => {
  it('hien tieu de la header, dong phu va nut ben phai', async () => {
    await render(
      <TabHeader
        title="Học phí"
        subtitle="Gói học và lịch sử đóng học phí"
        trailing={<Text>Nút</Text>}
      />,
    );

    expect(screen.getByRole('header', { name: 'Học phí' })).toBeOnTheScreen();
    expect(screen.getByText('Gói học và lịch sử đóng học phí')).toBeOnTheScreen();
    expect(screen.getByText('Nút')).toBeOnTheScreen();
  });

  it('khong co dong phu thi chi hien tieu de', async () => {
    await render(<TabHeader title="Tài khoản" />);

    expect(screen.getByRole('header', { name: 'Tài khoản' })).toBeOnTheScreen();
  });
});
