import { getFontFace } from '@/components/ui/themed-text';
import { FontFamily } from '@/constants/theme';

describe('getFontFace', () => {
  it('chon file Be Vietnam Pro theo do dam, bo fontWeight de Android khong to dam gia', () => {
    expect(getFontFace({ fontWeight: 700 })).toEqual({
      fontFamily: FontFamily.bold,
      fontWeight: 'normal',
      fontStyle: 'normal',
    });
    expect(getFontFace({ fontWeight: 'bold' }).fontFamily).toBe(FontFamily.bold);
    expect(getFontFace({ fontWeight: '600' }).fontFamily).toBe(FontFamily.semiBold);
    expect(getFontFace({ fontWeight: 500 }).fontFamily).toBe(FontFamily.medium);
  });

  it('do dam chua nap thi lam tron xuong, khong dat do dam thi dung ban thuong', () => {
    expect(getFontFace({ fontWeight: 900 }).fontFamily).toBe(FontFamily.bold);
    expect(getFontFace({ fontWeight: 300 }).fontFamily).toBe(FontFamily.regular);
    expect(getFontFace({}).fontFamily).toBe(FontFamily.regular);
    expect(getFontFace({ fontWeight: 'normal' }).fontFamily).toBe(FontFamily.regular);
  });

  it('chu nghieng dung file nghieng, bo fontStyle de Android khong nghieng gia them', () => {
    expect(getFontFace({ fontWeight: 500, fontStyle: 'italic' })).toEqual({
      fontFamily: FontFamily.mediumItalic,
      fontWeight: 'normal',
      fontStyle: 'normal',
    });
  });

  it('giu nguyen style da tu chon fontFamily (vd chu code dung font mono)', () => {
    expect(getFontFace({ fontFamily: 'monospace', fontWeight: 700 })).toEqual({});
  });
});
