import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  UIImagePickerPreferredAssetRepresentationMode,
  type ImagePickerAsset,
  type ImagePickerOptions,
} from 'expo-image-picker';
import { Platform } from 'react-native';

import { logger } from './logger';

/** Chup bang camera hay chon anh co san trong may. */
export type ImageSource = 'camera' | 'library';

/** Anh da chon, dung dinh dang BE nhan (`POST /academic/files` chi nhan JPEG, PNG, PDF). */
export type PickedImage = {
  /** Duong dan file tren may, dung de hien anh xem truoc va de gui len. */
  uri: string;
  /** Ten file gui BE: BE kiem tra duoi file khop voi `mimeType`. */
  name: string;
  mimeType: 'image/jpeg' | 'image/png';
  /** Byte, null khi he dieu hanh khong cho biet. */
  size: number | null;
};

export type PickImageResult =
  | { status: 'PICKED'; image: PickedImage }
  | { status: 'CANCELED' }
  /** Nguoi dung tu choi quyen camera. */
  | { status: 'PERMISSION_DENIED' }
  /** Dinh dang BE khong nhan (vd GIF). */
  | { status: 'UNSUPPORTED' }
  | { status: 'TOO_LARGE' }
  /** Khong mo duoc camera hoac thu vien anh (vd may khong co camera). */
  | { status: 'FAILED' };

/** Gioi han cua `POST /academic/files`. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Nen JPEG: anh 12 MP con khoang 2-4 MB, van doc ro chu viet tay, gui nhanh tren 4G. */
const COMPRESS_QUALITY = 0.7;

const PICKER_OPTIONS: ImagePickerOptions = {
  mediaTypes: ['images'],
  // Android: quality < 1 thi anh duoc nen lai thanh JPEG (hoac PNG)
  quality: COMPRESS_QUALITY,
  exif: false,
  // iOS: anh HEIC trong thu vien duoc doi sang JPEG; BE khong nhan HEIC
  preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Compatible,
};

const IMAGE_FORMATS = {
  jpeg: { mimeType: 'image/jpeg', extension: '.jpg', pattern: /\.jpe?g$/i },
  png: { mimeType: 'image/png', extension: '.png', pattern: /\.png$/i },
} as const;

const MIME_TO_FORMAT: Partial<Record<string, keyof typeof IMAGE_FORMATS>> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
};

type PickerAsset = Pick<ImagePickerAsset, 'uri' | 'mimeType' | 'fileName' | 'fileSize'>;

function detectFormat({ uri, mimeType, fileName }: PickerAsset): keyof typeof IMAGE_FORMATS | null {
  // He dieu hanh da bao dinh dang thi tin theo do: anh GIF co the mang ten .jpeg
  if (mimeType) return MIME_TO_FORMAT[mimeType.toLowerCase()] ?? null;
  const path = fileName ?? uri;
  if (IMAGE_FORMATS.jpeg.pattern.test(path)) return 'jpeg';
  if (IMAGE_FORMATS.png.pattern.test(path)) return 'png';
  return null;
}

/**
 * Doi anh he dieu hanh tra ve sang anh gui duoc BE: chi JPEG, PNG; ten file theo thoi diem chon, duoi
 * file khop dinh dang. null khi dinh dang BE khong nhan.
 */
export function toPickedImage(asset: PickerAsset, now: Date = new Date()): PickedImage | null {
  const format = detectFormat(asset);
  if (!format) return null;
  const { mimeType, extension } = IMAGE_FORMATS[format];
  return {
    uri: asset.uri,
    name: `bai-lam-${now.getTime()}${extension}`,
    mimeType,
    size: asset.fileSize ?? null,
  };
}

/** Mo camera hoac thu vien anh, tra anh da chon hoac ly do khong co anh. */
export async function pickImage(source: ImageSource): Promise<PickImageResult> {
  try {
    if (source === 'camera') {
      const permission = await requestCameraPermissionsAsync();
      if (!permission.granted) return { status: 'PERMISSION_DENIED' };
    }
    const result =
      source === 'camera'
        ? await launchCameraAsync(PICKER_OPTIONS)
        : await launchImageLibraryAsync(PICKER_OPTIONS);
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return { status: 'CANCELED' };

    const image = toPickedImage(asset);
    if (!image) return { status: 'UNSUPPORTED' };
    if (image.size !== null && image.size > MAX_IMAGE_BYTES) return { status: 'TOO_LARGE' };
    return { status: 'PICKED', image };
  } catch (error) {
    logger.warn('[image-picker] Khong mo duoc camera hoac thu vien anh', error);
    return { status: 'FAILED' };
  }
}

/**
 * Them anh vao FormData de gui multipart. Native nhan doi tuong `{ uri, name, type }` va tu doc file;
 * web khong hieu doi tuong do nen phai doi `uri` (blob:, data:) thanh Blob.
 */
export async function appendImageToForm(
  form: FormData,
  field: string,
  image: PickedImage,
): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(image.uri)).blob();
    form.append(field, blob, image.name);
    return;
  }
  // FormData cua React Native nhan `{ uri, name, type }` cho file, kieu cua DOM chi khai bao Blob
  const file = { uri: image.uri, name: image.name, type: image.mimeType } as unknown as Blob;
  form.append(field, file);
}
