import { getDocumentAsync } from 'expo-document-picker';

import { logger } from './logger';

/** File PDF da chon, dung dinh dang BE nhan (`POST /academic/files` nhan JPEG, PNG, PDF). */
export type PickedPdf = {
  /** Duong dan file tren may, dung de gui len. */
  uri: string;
  /** Ten file hien cho phu huynh va gui BE: BE kiem tra duoi `.pdf` khop voi `mimeType`. */
  name: string;
  mimeType: 'application/pdf';
  /** Byte, null khi he dieu hanh khong cho biet. */
  size: number | null;
};

export type PickPdfResult =
  | { status: 'PICKED'; file: PickedPdf }
  | { status: 'CANCELED' }
  /** File khong phai PDF. */
  | { status: 'UNSUPPORTED' }
  | { status: 'TOO_LARGE' }
  /** Khong mo duoc trinh chon file. */
  | { status: 'FAILED' };

const PDF_MIME = 'application/pdf';
const PDF_EXTENSION = /\.pdf$/i;

type DocumentAsset = { uri: string; name: string; mimeType?: string; size?: number };

/** Doi file he dieu hanh tra ve sang file gui duoc BE; null khi khong phai PDF. */
export function toPickedPdf(asset: DocumentAsset): PickedPdf | null {
  const isPdf = asset.mimeType
    ? asset.mimeType.toLowerCase() === PDF_MIME
    : PDF_EXTENSION.test(asset.name);
  if (!isPdf) return null;
  const name = PDF_EXTENSION.test(asset.name) ? asset.name : `${asset.name}.pdf`;
  return { uri: asset.uri, name, mimeType: PDF_MIME, size: asset.size ?? null };
}

/** Mo trinh chon file cua may, chi cho chon PDF. */
export async function pickPdf(maxBytes: number): Promise<PickPdfResult> {
  try {
    const result = await getDocumentAsync({
      type: PDF_MIME,
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
    logger.warn('[document-picker] Khong mo duoc trinh chon file', error);
    return { status: 'FAILED' };
  }
}
