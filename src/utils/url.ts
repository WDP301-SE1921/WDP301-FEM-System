/**
 * Khoa cache cua anh lay qua link ky co han (anh dai dien, anh bai lam): bo phan query chua chu ky va
 * han dung. Moi lan goi BE tra link moi cho cung mot anh, nen cache theo ca link thi lan nao cung tai
 * lai; duong dan cua anh doi khi anh doi (BE dat ten moi cho moi anh tai len).
 */
export function getSignedUrlCacheKey(url: string): string {
  const end = url.search(/[?#]/);
  return end === -1 ? url : url.slice(0, end);
}
