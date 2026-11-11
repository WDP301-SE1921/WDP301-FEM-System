import { toPickedPdf } from '@/lib/document-picker';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));

describe('toPickedPdf', () => {
  it('nhan file PDF theo mimeType hoac duoi file, them duoi .pdf khi thieu', () => {
    expect(
      toPickedPdf({ uri: 'file:///a', name: 'bai-lam.pdf', mimeType: 'application/pdf', size: 10 }),
    ).toEqual({ uri: 'file:///a', name: 'bai-lam.pdf', mimeType: 'application/pdf', size: 10 });
    expect(toPickedPdf({ uri: 'file:///b', name: 'Bai.PDF' })).toEqual({
      uri: 'file:///b',
      name: 'Bai.PDF',
      mimeType: 'application/pdf',
      size: null,
    });
    expect(toPickedPdf({ uri: 'file:///c', name: 'scan', mimeType: 'application/pdf' })?.name).toBe(
      'scan.pdf',
    );
  });

  it('bo file khong phai PDF', () => {
    expect(toPickedPdf({ uri: 'file:///d', name: 'a.pdf', mimeType: 'image/png' })).toBeNull();
    expect(toPickedPdf({ uri: 'file:///e', name: 'bai.docx' })).toBeNull();
  });
});
