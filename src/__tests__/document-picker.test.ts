import { getDocumentAsync } from 'expo-document-picker';

import { MAX_PDF_BYTES, pickPdf, toPickedPdf } from '@/lib/document-picker';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const getDocument = jest.mocked(getDocumentAsync);

const PDF_ASSET = {
  uri: 'file:///cache/DocumentPicker/abc.pdf',
  name: 'Bài kiểm tra 15 phút.pdf',
  mimeType: 'application/pdf',
  size: 800_000,
  lastModified: 0,
};

function picked(asset: Partial<typeof PDF_ASSET>) {
  return { canceled: false as const, assets: [{ ...PDF_ASSET, ...asset }] };
}

describe('lib/document-picker', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('toPickedPdf', () => {
    it('giu ten goc, luon co duoi .pdf cho BE', () => {
      expect(toPickedPdf(PDF_ASSET)).toEqual({
        uri: PDF_ASSET.uri,
        name: 'Bài kiểm tra 15 phút.pdf',
        mimeType: 'application/pdf',
        size: 800_000,
      });
      // Kho tep bao octet-stream nhung ten la .pdf: van nhan, BE kiem tra noi dung
      expect(
        toPickedPdf({ ...PDF_ASSET, name: 'BAI.PDF', mimeType: 'application/octet-stream' })?.name,
      ).toBe('BAI.pdf');
      // He dieu hanh bao PDF ma ten khong co duoi: them duoi
      expect(toPickedPdf({ ...PDF_ASSET, name: 'scan' })?.name).toBe('scan.pdf');
      expect(toPickedPdf({ ...PDF_ASSET, name: '.pdf' })?.name).toBe('bai-lam.pdf');
    });

    it('khong phai PDF thi null', () => {
      expect(toPickedPdf({ ...PDF_ASSET, name: 'a.docx', mimeType: 'application/msword' })).toBe(
        null,
      );
    });
  });

  describe('pickPdf', () => {
    it('chi cho chon PDF, chep vao bo nho dem cua app', async () => {
      getDocument.mockResolvedValueOnce(picked({}));

      await expect(pickPdf()).resolves.toEqual({
        status: 'PICKED',
        file: expect.objectContaining({ name: PDF_ASSET.name }),
      });
      expect(getDocument).toHaveBeenCalledWith({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });
    });

    it('huy, tep sai loai, tep qua lon va loi mo trinh chon tep', async () => {
      getDocument.mockResolvedValueOnce({ canceled: true, assets: null });
      await expect(pickPdf()).resolves.toEqual({ status: 'CANCELED' });

      getDocument.mockResolvedValueOnce(picked({ name: 'a.png', mimeType: 'image/png' }));
      await expect(pickPdf()).resolves.toEqual({ status: 'UNSUPPORTED' });

      getDocument.mockResolvedValueOnce(picked({ size: MAX_PDF_BYTES + 1 }));
      await expect(pickPdf()).resolves.toEqual({ status: 'TOO_LARGE' });

      getDocument.mockRejectedValueOnce(new Error('No activity'));
      await expect(pickPdf()).resolves.toEqual({ status: 'FAILED' });
    });
  });
});
