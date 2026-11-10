import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  UIImagePickerPreferredAssetRepresentationMode,
  type ImagePickerAsset,
  type ImagePickerOptions,
} from 'expo-image-picker';

import { logger } from './logger';

/** Chup bang camera hay chon anh co san trong may. */
export type ImageSource = 'camera' | 'library';

/**
 * Anh da chon, dung dinh dang BE nhan (`POST /academic/files` nhan JPEG, PNG, PDF; anh dai dien chi
 * JPEG, PNG).
 */
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

/** Ly do khong co anh de gui (nguoi dung tu huy thi khong can bao). */
export type PickImageProblem = Exclude<PickImageResult['status'], 'PICKED' | 'CANCELED'>;

/** Gioi han cua `POST /academic/files`. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const DEFAULT_FILE_NAME_PREFIX = 'bai-lam';

/** Gioi han va cach cat anh theo noi nhan anh. Mac dinh la anh bai lam (`POST /academic/files`). */
export type PickImageOptions = {
  /** Anh lon hon thi bao `TOO_LARGE`, khong gui. */
  maxBytes: number;
  /** Dau ten file gui BE, vd `bai-lam`. */
  fileNamePrefix: string;
  /** Cho cat anh theo ti le `[rong, cao]` truoc khi gui (iOS luon cat vuong). Bo trong thi giu anh goc. */
  aspect?: [number, number];
};

const DEFAULT_PICK_OPTIONS: PickImageOptions = {
  maxBytes: MAX_IMAGE_BYTES,
  fileNamePrefix: DEFAULT_FILE_NAME_PREFIX,
};

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

function toPickerOptions({ aspect }: PickImageOptions): ImagePickerOptions {
  return aspect ? { ...PICKER_OPTIONS, allowsEditing: true, aspect } : PICKER_OPTIONS;
}

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
export function toPickedImage(
  asset: PickerAsset,
  now: Date = new Date(),
  fileNamePrefix: string = DEFAULT_FILE_NAME_PREFIX,
): PickedImage | null {
  const format = detectFormat(asset);
  if (!format) return null;
  const { mimeType, extension } = IMAGE_FORMATS[format];
  return {
    uri: asset.uri,
    name: `${fileNamePrefix}-${now.getTime()}${extension}`,
    mimeType,
    size: asset.fileSize ?? null,
  };
}

/** Mo camera hoac thu vien anh, tra anh da chon hoac ly do khong co anh. */
export async function pickImage(
  source: ImageSource,
  options: PickImageOptions = DEFAULT_PICK_OPTIONS,
): Promise<PickImageResult> {
  try {
    if (source === 'camera') {
      const permission = await requestCameraPermissionsAsync();
      if (!permission.granted) return { status: 'PERMISSION_DENIED' };
    }
    const pickerOptions = toPickerOptions(options);
    const result =
      source === 'camera'
        ? await launchCameraAsync(pickerOptions)
        : await launchImageLibraryAsync(pickerOptions);
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return { status: 'CANCELED' };

    const image = toPickedImage(asset, new Date(), options.fileNamePrefix);
    if (!image) return { status: 'UNSUPPORTED' };
    if (image.size !== null && image.size > options.maxBytes) return { status: 'TOO_LARGE' };
    return { status: 'PICKED', image };
  } catch (error) {
    logger.warn('[image-picker] Khong mo duoc camera hoac thu vien anh', error);
    return { status: 'FAILED' };
  }
}
