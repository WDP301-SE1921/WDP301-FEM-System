import { render, screen, userEvent } from '@testing-library/react-native';

import { TabBar, type TabBarItem } from '@/components/common/tab-bar';

const ITEMS: TabBarItem[] = [
  {
    key: 'index-key',
    label: 'Trang chủ',
    icon: 'home-outline',
    focusedIcon: 'home',
    isFocused: true,
  },
  {
    key: 'grades-key',
    label: 'Điểm & Bài',
    icon: 'document-text-outline',
    focusedIcon: 'document-text',
    isFocused: false,
  },
];

describe('components/common/TabBar', () => {
  it('danh dau tab dang mo cho trinh doc man hinh', async () => {
    await render(<TabBar items={ITEMS} bottomInset={0} onPress={jest.fn()} />);

    expect(screen.getByRole('tab', { name: 'Trang chủ' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Điểm & Bài' })).not.toBeSelected();
  });

  it('bao key cua tab duoc bam va giu', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    await render(
      <TabBar items={ITEMS} bottomInset={34} onPress={onPress} onLongPress={onLongPress} />,
    );

    await user.press(screen.getByRole('tab', { name: 'Điểm & Bài' }));
    await user.longPress(screen.getByRole('tab', { name: 'Trang chủ' }));

    expect(onPress).toHaveBeenCalledWith('grades-key');
    expect(onLongPress).toHaveBeenCalledWith('index-key');
  });
});
