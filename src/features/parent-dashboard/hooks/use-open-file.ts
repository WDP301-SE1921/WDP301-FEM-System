import { useQueryClient } from '@tanstack/react-query';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useState } from 'react';

import { queryKeys } from '@/api/query-client';
import { getErrorMessage } from '@/utils/error';

import { parentDashboardApi } from '../api/parent-dashboard-api';
import { FILE_PREVIEW_STALE_MS } from '../constants';

/**
 * Mo mot tep tren BE (vd de bai PDF giao vien dinh kem) bang trinh duyet trong app. Link BE ky co han
 * nen lay qua cung cache voi `useFilePreview`: link con han thi dung lai, het han thi xin link moi.
 */
export function useOpenFile() {
  const client = useQueryClient();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = async (fileId: string) => {
    setOpeningId(fileId);
    setError(null);
    try {
      const { url } = await client.fetchQuery({
        queryKey: queryKeys.academic.filePreview(fileId),
        queryFn: () => parentDashboardApi.getFilePreview(fileId),
        staleTime: FILE_PREVIEW_STALE_MS,
      });
      await openBrowserAsync(url, { presentationStyle: WebBrowserPresentationStyle.AUTOMATIC });
    } catch (caught) {
      setError(getErrorMessage(caught, 'Không mở được tệp. Thử lại sau.'));
    } finally {
      setOpeningId(null);
    }
  };

  return { open, openingId, error };
}
