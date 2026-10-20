import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Cau hinh app theo tung moi truong.
 * Chay: APP_VARIANT=development npx expo start
 */
type Variant = 'development' | 'preview' | 'production';

const variant = (process.env.APP_VARIANT ?? 'development') as Variant;

const variants: Record<Variant, { name: string; bundleId: string; scheme: string }> = {
  development: {
    name: 'FEM Dev',
    bundleId: 'com.wdp301.fem.dev',
    scheme: 'femdev',
  },
  preview: {
    name: 'FEM Staging',
    bundleId: 'com.wdp301.fem.preview',
    scheme: 'fempreview',
  },
  production: {
    name: 'FEM System',
    bundleId: 'com.wdp301.fem',
    scheme: 'fem',
  },
};

const current = variants[variant];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: current.name,
  slug: 'wdp301-fem-system',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: current.scheme,
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: current.bundleId,
    icon: './assets/expo.icon',
  },
  android: {
    package: current.bundleId,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      // Hoc sinh chup hoac chon anh bai tu luan de nop kem bai (POST /academic/files)
      'expo-image-picker',
      {
        photosPermission: 'EduGrade cần xem ảnh để học sinh chọn ảnh bài làm gửi giáo viên.',
        cameraPermission: 'EduGrade cần dùng camera để học sinh chụp bài làm gửi giáo viên.',
        microphonePermission: false,
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    variant,
    eas: {
      // Dien projectId sau khi chay: eas init
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
