import { io } from 'socket.io-client';

import { logger } from './logger';

/** BE tu choi token (sai, het han, phien da thu hoi): doi token roi ket noi lai. */
const AUTH_ERROR = 'AUTH_UNAUTHORIZED';
/** Loi cau hinh, thu lai cung khong qua duoc. */
const FATAL_ERRORS: readonly string[] = ['ORIGIN_NOT_ALLOWED'];
/** BE chu dong dong socket: access token het han hoac phien bi thu hoi. */
const SERVER_DISCONNECT = 'io server disconnect';
const RETRY_BASE_DELAY_MS = 2_000;
const RETRY_MAX_DELAY_MS = 60_000;

export type RealtimeChannelOptions = {
  /** Dia chi namespace, vd `http://192.168.1.10:3000/notifications`. */
  url: string;
  /** Duong dan transport cua Socket.IO tren server, vd `/socket.io`. */
  path: string;
  /** Access token cho moi lan bat tay; khong dat token vao URL. */
  getToken: () => Promise<string | null>;
  /** Doi access token moi khi BE tu choi token cu. null thi dung ket noi realtime. */
  renewToken: () => Promise<string | null>;
  /** Su kien cua server va ham xu ly. Payload bi bo qua: client tu tai lai du lieu. */
  listeners: Readonly<Record<string, () => void>>;
  /** Moi lan ket noi (ca ket noi lai): luc nay co the da lo su kien nen client tai lai du lieu. */
  onConnect: () => void;
};

export type RealtimeChannel = {
  /** Ket noi neu chua ket noi va khong dang tu ket noi lai, vd khi app tro lai man hinh. */
  open: () => void;
  /** Ngat va bo moi listener, vd khi dang xuat. Khong mo lai duoc. */
  close: () => void;
};

/**
 * Kenh realtime boc `socket.io-client`, chi dung websocket. Loi mang thi Socket.IO tu ket noi lai; BE
 * tu choi token hoac dong socket thi doi token mot lan roi ket noi lai; loi tam thoi khac thi thu lai
 * cham dan.
 */
export function createRealtimeChannel(options: RealtimeChannelOptions): RealtimeChannel {
  let isClosed = false;
  let isRenewing = false;
  /** Da doi token ma chua ket noi lai duoc: bi tu choi tiep thi dung de khong refresh lien tuc. */
  let hasRenewedSinceConnect = false;
  let retryAttempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const socket = io(options.url, {
    path: options.path,
    transports: ['websocket'],
    autoConnect: false,
    auth: (callback) => {
      options.getToken().then(
        (token) => callback({ token }),
        (error: unknown) => {
          logger.warn('[realtime] Khong doc duoc access token', error);
          callback({ token: null });
        },
      );
    },
  });

  function connect() {
    // `active` la socket dang ket noi hoac Socket.IO dang tu ket noi lai
    if (isClosed || socket.active) return;
    socket.connect();
  }

  async function renewAndReconnect() {
    if (isClosed || isRenewing) return;
    if (hasRenewedSinceConnect) {
      logger.warn('[realtime] Van bi tu choi sau khi doi token, dung ket noi realtime');
      return;
    }

    isRenewing = true;
    hasRenewedSinceConnect = true;
    try {
      const token = await options.renewToken();
      if (token) connect();
      else logger.warn('[realtime] Khong doi duoc token, dung ket noi realtime');
    } finally {
      isRenewing = false;
    }
  }

  function retryLater() {
    clearTimeout(retryTimer);
    const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** retryAttempt, RETRY_MAX_DELAY_MS);
    retryAttempt += 1;
    retryTimer = setTimeout(connect, delay);
  }

  // Dang ky listener truoc khi ket noi de khong lo su kien dau tien
  Object.entries(options.listeners).forEach(([event, handler]) => socket.on(event, handler));
  socket.on('connect', () => {
    retryAttempt = 0;
    hasRenewedSinceConnect = false;
    options.onConnect();
  });
  socket.on('disconnect', (reason) => {
    if (reason === SERVER_DISCONNECT) void renewAndReconnect();
  });
  socket.on('connect_error', (error) => {
    // Loi mang: Socket.IO van dang tu ket noi lai
    if (socket.active) return;
    if (error.message === AUTH_ERROR) {
      void renewAndReconnect();
      return;
    }
    if (FATAL_ERRORS.includes(error.message)) {
      logger.warn('[realtime] BE tu choi ket noi, kiem tra cau hinh', { code: error.message });
      return;
    }
    retryLater();
  });

  return {
    open: connect,
    close: () => {
      isClosed = true;
      clearTimeout(retryTimer);
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}
