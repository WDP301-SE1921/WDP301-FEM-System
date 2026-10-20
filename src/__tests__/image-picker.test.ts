import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
} from 'expo-image-picker';

import { MAX_IMAGE_BYTES, pickImage, toPickedImage } from '@/lib/image-picker';

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  UIImagePickerPreferredAssetRepresentationMode: { Compatible: 'compatible' },
}));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const camera = jest.mocked(launchCameraAsync);
const library = jest.mocked(launchImageLibraryAsync);
const cameraPermission = jest.mocked(requestCameraPermissionsAsync);

const NOW = new Date(2026, 9, 21, 9, 30);
const JPEG_ASSET = {
  uri: 'file:///cache/ImagePicker/abc.jpeg',
  mimeType: 'image/jpeg',
  fileName: 'abc.jpeg',
  fileSize: 2_000_000,
};

/** Ket qua picker toi thieu ma lib doc toi, du field nhu cua `expo-image-picker`. */
function pickedResult(asset: Partial<typeof JPEG_ASSET>) {
  return {
    canceled: false as const,
    assets: [{ ...JPEG_ASSET, width: 3000, height: 4000, type: 'image' as const, ...asset }],
  };
}

describe('lib/image-picker', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('toPickedImage', () => {
    it('chi nhan JPEG, PNG; ten file theo thoi diem chon, duoi file khop dinh dang cho BE', () => {
      expect(toPickedImage(JPEG_ASSET, NOW)).toEqual({
        uri: JPEG_ASSET.uri,
        name: `bai-lam-${NOW.getTime()}.jpg`,
        mimeType: 'image/jpeg',
        size: 2_000_000,
      });
      expect(
        toPickedImage({ uri: 'file:///a.PNG', mimeType: undefined, fileName: null }, NOW),
      ).toMatchObject({ name: `bai-lam-${NOW.getTime()}.png`, mimeType: 'image/png', size: null });
      // Khong co mimeType thi doan theo duoi file
      expect(toPickedImage({ uri: 'file:///b.jpg' }, NOW)?.mimeType).toBe('image/jpeg');
    });

    it('dinh dang BE khong nhan (HEIC, GIF) thi null', () => {
      expect(toPickedImage({ uri: 'file:///c.heic', mimeType: 'image/heic' }, NOW)).toBeNull();
      expect(toPickedImage({ uri: 'file:///d.gif', mimeType: 'image/gif' }, NOW)).toBeNull();
    });
  });

  describe('pickImage', () => {
    it('chon anh trong thu vien: nen JPEG, doi HEIC cua iOS sang dinh dang tuong thich', async () => {
      library.mockResolvedValue(pickedResult({}));

      await expect(pickImage('library')).resolves.toMatchObject({
        status: 'PICKED',
        image: { uri: JPEG_ASSET.uri, mimeType: 'image/jpeg' },
      });
      expect(library).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaTypes: ['images'],
          quality: 0.7,
          preferredAssetRepresentationMode: 'compatible',
        }),
      );
      // Thu vien anh khong can xin quyen
      expect(cameraPermission).not.toHaveBeenCalled();
    });

    it('camera: xin quyen truoc, bi tu choi thi khong mo camera', async () => {
      cameraPermission.mockResolvedValueOnce({ granted: false } as Awaited<
        ReturnType<typeof requestCameraPermissionsAsync>
      >);

      await expect(pickImage('camera')).resolves.toEqual({ status: 'PERMISSION_DENIED' });
      expect(camera).not.toHaveBeenCalled();
    });

    it('huy, anh sai dinh dang, anh qua lon va loi mo camera', async () => {
      cameraPermission.mockResolvedValue({ granted: true } as Awaited<
        ReturnType<typeof requestCameraPermissionsAsync>
      >);

      camera.mockResolvedValueOnce({ canceled: true, assets: null });
      await expect(pickImage('camera')).resolves.toEqual({ status: 'CANCELED' });

      camera.mockResolvedValueOnce(pickedResult({ uri: 'file:///e.gif', mimeType: 'image/gif' }));
      await expect(pickImage('camera')).resolves.toEqual({ status: 'UNSUPPORTED' });

      camera.mockResolvedValueOnce(pickedResult({ fileSize: MAX_IMAGE_BYTES + 1 }));
      await expect(pickImage('camera')).resolves.toEqual({ status: 'TOO_LARGE' });

      camera.mockRejectedValueOnce(new Error('No camera'));
      await expect(pickImage('camera')).resolves.toEqual({ status: 'FAILED' });
    });
  });
});
