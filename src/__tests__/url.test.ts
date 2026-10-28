import { getSignedUrlCacheKey } from '@/utils/url';

describe('utils/url', () => {
  describe('getSignedUrlCacheKey', () => {
    it('bo chu ky va han dung, giu duong dan cua anh', () => {
      const path = 'https://storage.example.com/edugrade/avatars/user-1/7f3a.png';

      expect(
        getSignedUrlCacheKey(`${path}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900`),
      ).toBe(path);
      // Hai link ky hai lan cho cung mot anh dung chung khoa cache
      expect(getSignedUrlCacheKey(`${path}?X-Amz-Signature=a`)).toBe(
        getSignedUrlCacheKey(`${path}?X-Amz-Signature=b`),
      );
    });

    it('link khong co query giu nguyen', () => {
      expect(getSignedUrlCacheKey('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
      expect(getSignedUrlCacheKey('https://example.com/a.jpg#x')).toBe('https://example.com/a.jpg');
    });
  });
});
