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
    // Ten duoi icon tren may. Ten tren store ("EduGrade - Phu huynh") nam o store.config.json.
    // Bundle id com.wdp301.fem giu nguyen (nguoi dung chot 2026-11-12): nop store roi la khong doi duoc.
    name: 'EduGrade',
    bundleId: 'com.wdp301.fem',
    scheme: 'fem',
  },
};

const current = variants[variant];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: current.name,
  owner: 'nhanle6',
  slug: 'wdp301-fem-system',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: current.scheme,
  // Khoa che do sang (nguoi dung chot ngay 2026-11-03): may bat che do toi van hien giao dien sang
  userInterfaceStyle: 'light',
  ios: {
    // Chua thu tren iPad; bat lai thi App Store bat chup them bo anh iPad va duyet tren iPad
    supportsTablet: false,
    bundleIdentifier: current.bundleId,
    icon: './assets/expo.icon',
    infoPlist: {
      // Chi dung HTTPS/TLS chuan cua he dieu hanh -> mien khai bao ma hoa, ASC khong hoi lai moi build
      ITSAppUsesNonExemptEncryption: false,
      // Trang App Store hien ngon ngu "Tieng Viet" (doc tu binary), khong phai "English"
      CFBundleDevelopmentRegion: 'vi',
      CFBundleLocalizations: ['vi'],
    },
  },
  android: {
    package: current.bundleId,
    // Thu vien tu gop cac quyen nay vao manifest du app khong dung; de lai thi Play hoi giai trinh
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
    adaptiveIcon: {
      // Mau primary cua app (#2563EB), trung nen icon (assets/images/android-icon-background.png)
      backgroundColor: '#2563EB',
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
        // Logo EduGrade tren nen primary (#2563EB), cung mau voi icon
        backgroundColor: '#2563EB',
        image: './assets/images/splash-icon.png',
        imageWidth: 140,
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
      // Project EAS @nhanle6/wdp301-fem-system, tao bang `eas init` ngay 2026-10-21.
      // Config dong nen eas init khong tu ghi duoc, phai dien tay.
      projectId: '78cf9028-7e15-443a-a58e-587d73060803',
    },
  },
});
