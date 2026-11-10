import { getDocumentAsync, type DocumentPickerAsset } from 'expo-document-picker';

import { logger } from './logger';
import { PDF_MIME_TYPE } from './upload-file';

/** Tep PDF da chon trong may, dung dinh dang `POST /academic/files` nhan. */
export type PickedPdf = {
  /** Duong dan ban sao trong bo nho dem cua app, dung de gui len. */
  uri: string;
  /** Ten goc cua tep, luon co duoi `.pdf`: BE kiem tra duoi file khop voi `mimeType`. */
  name: string;
  mimeType: typeof PDF_MIME_TYPE;
  /** Byte, null khi he dieu hanh khong cho biet. */
  size: number | null;
};

export type PickPdfResult =
  | { status: 'PICKED'; file: PickedPdf }
  | { status: 'CANCELED' }
  /** Tep khong phai PDF (trinh chon tep cua mot so may van cho chon tep khac). */
  | { status: 'UNSUPPORTED' }
  | { status: 'TOO_LARGE' }
  /** Khong mo duoc trinh chon tep. */
  | { status: 'FAILED' };

/** Ly do khong co tep de gui (nguoi dung tu huy thi khong can bao). */
export type PickPdfProblem = Exclude<PickPdfResult['status'], 'PICKED' | 'CANCELED'>;

/** Gioi han cua `POST /academic/files`. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

const PDF_EXTENSION = /\.pdf$/i;
/** Ten tep dai qua thi cat bot, du doc tren man hinh; BE nhan toi 255 ky tu. */
const MAX_NAME_LENGTH = 120;
const FALLBACK_NAME = 'bai-lam';

type PickerAsset = Pick<DocumentPickerAsset, 'uri' | 'name' | 'mimeType' | 'size'>;

/**
 * Doi tep he dieu hanh tra ve sang tep gui duoc BE. Nhan khi he dieu hanh bao la PDF hoac ten tep co
 * duoi `.pdf` (mot so kho tep bao `application/octet-stream`); BE con kiem tra noi dung tep. null khi
 * khong phai PDF.
 */
export function toPickedPdf(asset: PickerAsset): PickedPdf | null {
  const isPdf = asset.mimeType?.toLowerCase() === PDF_MIME_TYPE || PDF_EXTENSION.test(asset.name);
  if (!isPdf) return null;
  const baseName = asset.name.replace(PDF_EXTENSION, '').trim().slice(0, MAX_NAME_LENGTH);
  return {
    uri: asset.uri,
    name: `${baseName || FALLBACK_NAME}.pdf`,
    mimeType: PDF_MIME_TYPE,
    size: asset.size ?? null,
  };
}

/** Mo trinh chon tep cua may, tra tep PDF da chon hoac ly do khong co tep. */
export async function pickPdf(maxBytes: number = MAX_PDF_BYTES): Promise<PickPdfResult> {
  try {
    // Chep vao bo nho dem cua app de luc gui con doc duoc tep (Android tra link tam cua kho tep)
    const result = await getDocumentAsync({
      type: PDF_MIME_TYPE,
      copyToCacheDirectory: true,
      multiple: false,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return { status: 'CANCELED' };

    const file = toPickedPdf(asset);
    if (!file) return { status: 'UNSUPPORTED' };
    if (file.size !== null && file.size > maxBytes) return { status: 'TOO_LARGE' };
    return { status: 'PICKED', file };
  } catch (error) {
    logger.warn('[document-picker] Khong mo duoc trinh chon tep', error);
    return { status: 'FAILED' };
  }
}
