import { io } from 'socket.io-client';

import { connectNotificationRealtime } from '@/features/parent-dashboard/api/notification-realtime';
import { createRealtimeChannel, type RealtimeChannelOptions } from '@/lib/realtime';

/**
 * Kenh realtime voi socket gia thay cho `socket.io-client`: kiem tra cach ket noi, doi token va thu
 * lai. Khong mo ket noi that toi BE.
 */

jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@/lib/storage', () => ({
  secureStorage: { get: jest.fn(() => Promise.resolve('access-token')) },
}));
jest.mock('@/api/client', () => ({ refreshSession: jest.fn() }));

type Handler = (...args: unknown[]) => void;

/** Socket gia: ghi lai listener, `connect` va `disconnect` de test phat su kien thay server. */
class FakeSocket {
  active = false;
  readonly handlers = new Map<string, Handler[]>();
  readonly connect = jest.fn(() => {
    this.active = true;
  });
  readonly disconnect = jest.fn(() => {
    this.active = false;
  });
  readonly removeAllListeners = jest.fn(() => this.handlers.clear());

  on(event: string, handler: Handler) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
    return this;
  }

  emit(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.forEach((handler) => handler(...args));
  }

  /** BE tu choi ket noi trong middleware: Socket.IO khong tu ket noi lai. */
  reject(code: string) {
    this.active = false;
    this.emit('connect_error', new Error(code));
  }
}

let mockSocket: FakeSocket;
jest.mock('socket.io-client', () => ({ io: jest.fn(() => mockSocket) }));
const mockedIo = jest.mocked(io);

/** Cho cac promise dang cho (doi token) chay xong. */
async function flushPromises() {
  for (let index = 0; index < 5; index += 1) await Promise.resolve();
}

function setup(overrides: Partial<RealtimeChannelOptions> = {}) {
  const options: RealtimeChannelOptions = {
    url: 'http://localhost:3000/notifications',
    path: '/socket.io',
    getToken: jest.fn(() => Promise.resolve('access-token')),
    renewToken: jest.fn(() => Promise.resolve('access-moi')),
    listeners: { 'notification.created': jest.fn() },
    onConnect: jest.fn(),
    ...overrides,
  };
  const channel = createRealtimeChannel(options);
  return { channel, options };
}

beforeEach(() => {
  mockSocket = new FakeSocket();
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('lib/realtime', () => {
  it('chi dung websocket, dang ky listener truoc khi ket noi, gui token qua auth', async () => {
    const { channel, options } = setup();
    expect(mockSocket.connect).not.toHaveBeenCalled();

    channel.open();

    expect(mockedIo).toHaveBeenCalledWith(options.url, {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      auth: expect.any(Function),
    });
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);

    const auth = mockedIo.mock.calls[0]?.[1]?.auth;
    const callback = jest.fn();
    if (typeof auth === 'function') auth(callback);
    await flushPromises();
    expect(callback).toHaveBeenCalledWith({ token: 'access-token' });

    mockSocket.emit('connect');
    mockSocket.emit('notification.created', { notificationId: 'n1' });
    expect(options.onConnect).toHaveBeenCalledTimes(1);
    expect(options.listeners['notification.created']).toHaveBeenCalledTimes(1);
  });

  it('dang ket noi hoac dang tu ket noi lai thi open khong mo them ket noi', () => {
    const { channel } = setup();

    channel.open();
    channel.open();

    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('BE tu choi token thi doi token mot lan roi ket noi lai; van bi tu choi thi dung', async () => {
    const { channel, options } = setup();
    channel.open();

    mockSocket.reject('AUTH_UNAUTHORIZED');
    await flushPromises();
    expect(options.renewToken).toHaveBeenCalledTimes(1);
    expect(mockSocket.connect).toHaveBeenCalledTimes(2);

    mockSocket.reject('AUTH_UNAUTHORIZED');
    await flushPromises();
    expect(options.renewToken).toHaveBeenCalledTimes(1);
    expect(mockSocket.connect).toHaveBeenCalledTimes(2);
  });

  it('ket noi lai thanh cong thi lan het han sau duoc doi token tiep', async () => {
    const { channel, options } = setup();
    channel.open();
    mockSocket.reject('AUTH_UNAUTHORIZED');
    await flushPromises();
    mockSocket.emit('connect');

    // BE dong mockSocket khi access token het han
    mockSocket.active = false;
    mockSocket.emit('disconnect', 'io server disconnect');
    await flushPromises();

    expect(options.renewToken).toHaveBeenCalledTimes(2);
    expect(mockSocket.connect).toHaveBeenCalledTimes(3);
  });

  it('khong doi duoc token thi khong ket noi lai', async () => {
    const { channel } = setup({ renewToken: jest.fn(() => Promise.resolve(null)) });
    channel.open();

    mockSocket.reject('AUTH_UNAUTHORIZED');
    await flushPromises();

    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('loi tam thoi thi thu lai cham dan; loi cau hinh thi dung; loi mang de Socket.IO tu lo', () => {
    jest.useFakeTimers();
    const { channel } = setup();
    channel.open();

    mockSocket.reject('REALTIME_UNAVAILABLE');
    jest.advanceTimersByTime(1_999);
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(mockSocket.connect).toHaveBeenCalledTimes(2);

    mockSocket.reject('REALTIME_RATE_LIMITED');
    jest.advanceTimersByTime(3_999);
    expect(mockSocket.connect).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(1);
    expect(mockSocket.connect).toHaveBeenCalledTimes(3);

    mockSocket.reject('ORIGIN_NOT_ALLOWED');
    jest.advanceTimersByTime(60_000);
    expect(mockSocket.connect).toHaveBeenCalledTimes(3);

    // Socket.IO van `active` khi loi mang: no tu ket noi lai, kenh khong goi them
    mockSocket.active = true;
    mockSocket.emit('connect_error', new Error('websocket error'));
    jest.advanceTimersByTime(60_000);
    expect(mockSocket.connect).toHaveBeenCalledTimes(3);
  });

  it('close ngat ket noi, bo listener va huy lan thu lai dang hen', () => {
    jest.useFakeTimers();
    const { channel } = setup();
    channel.open();
    mockSocket.reject('REALTIME_UNAVAILABLE');

    channel.close();
    jest.advanceTimersByTime(60_000);
    channel.open();

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(mockSocket.removeAllListeners).toHaveBeenCalledTimes(1);
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });
});

describe('features/parent-dashboard/api/notification-realtime', () => {
  it('ket noi namespace thong bao o goc server cua BE, khong qua prefix REST', () => {
    const handlers = {
      onNotificationCreated: jest.fn(),
      onReadChanged: jest.fn(),
      onConnected: jest.fn(),
    };

    connectNotificationRealtime(handlers);
    mockSocket.emit('notification.created', { notificationId: 'n1' });
    mockSocket.emit('notifications.read-changed', {});

    // Dia chi BE trong `jest.setup.js` la http://localhost:3000/api/v1
    expect(mockedIo).toHaveBeenCalledWith(
      'http://localhost:3000/notifications',
      expect.objectContaining({ path: '/socket.io', transports: ['websocket'] }),
    );
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
    expect(handlers.onNotificationCreated).toHaveBeenCalledTimes(1);
    expect(handlers.onReadChanged).toHaveBeenCalledTimes(1);
  });
});
