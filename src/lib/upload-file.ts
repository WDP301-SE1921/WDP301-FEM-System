import { Platform } from 'react-native';

export const PDF_MIME_TYPE = 'application/pdf';

/** Tep tren may gui len BE qua multipart: anh (xem `lib/image-picker`) hoac PDF (`lib/document-picker`). */
export type UploadableFile = {
  /** Duong dan file tren may (web: `blob:`, `data:`). */
  uri: string;
  /** Ten file gui BE: BE kiem tra duoi file khop voi `mimeType`. */
  name: string;
  mimeType: string;
};

/**
 * Them tep vao FormData de gui multipart. Native nhan doi tuong `{ uri, name, type }` va tu doc file;
 * web khong hieu doi tuong do nen phai doi `uri` (blob:, data:) thanh Blob.
 */
export async function appendFileToForm(
  form: FormData,
  field: string,
  file: UploadableFile,
): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    form.append(field, blob, file.name);
    return;
  }
  // FormData cua React Native nhan `{ uri, name, type }` cho file, kieu cua DOM chi khai bao Blob
  const native = { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob;
  form.append(field, native);
}
