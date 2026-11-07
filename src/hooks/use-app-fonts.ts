// Import tung do dam: import tu goc package se dong goi ca 18 file font (khoang 2,4 MB)
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_500Medium_Italic } from '@expo-google-fonts/be-vietnam-pro/500Medium_Italic';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';

import { FontFamily } from '@/constants/theme';
import { logger } from '@/lib/logger';

const APP_FONTS = {
  [FontFamily.regular]: BeVietnamPro_400Regular,
  [FontFamily.medium]: BeVietnamPro_500Medium,
  [FontFamily.semiBold]: BeVietnamPro_600SemiBold,
  [FontFamily.bold]: BeVietnamPro_700Bold,
  [FontFamily.mediumItalic]: BeVietnamPro_500Medium_Italic,
};

/**
 * Nap font cua app. true khi da xong, ke ca khi nap loi: luc do chu hien bang font he thong thay vi
 * de app treo o man hinh splash.
 */
export function useAppFonts(): boolean {
  const [isLoaded, error] = useFonts(APP_FONTS);

  useEffect(() => {
    if (error) logger.warn('Khong nap duoc font Be Vietnam Pro, dung font he thong', error);
  }, [error]);

  return isLoaded || error !== null;
}
