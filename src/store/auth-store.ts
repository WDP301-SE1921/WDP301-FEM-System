import { create } from 'zustand';

import { setUnauthorizedHandler } from '@/api/client';
import { queryClient } from '@/api/query-client';
import { StorageKeys } from '@/constants/storage-keys';
import { logger } from '@/lib/logger';
import { secureStorage, storage } from '@/lib/storage';
import type { AuthSession, User } from '@/types/auth';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  /** false cho toi khi doc xong token da luu -> tranh nhay man hinh luc mo app */
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  /** Luu phien BE tra ve sau login, register. */
  signIn: (session: AuthSession) => Promise<void>;
  /** Ghi de tai khoan cua phien dang co bang ban moi doc tu BE, vd sau khi xac minh email. */
  setUser: (user: User) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [token, user] = await Promise.all([
        secureStorage.get(StorageKeys.accessToken),
        storage.getJson<User>(StorageKeys.user),
      ]);
      set({ user, isAuthenticated: Boolean(token && user) });
    } catch (error) {
      logger.error('auth.hydrate', error);
    } finally {
      set({ isHydrated: true });
    }
  },

  signIn: async ({ user, tokens }) => {
    await Promise.all([
      secureStorage.set(StorageKeys.accessToken, tokens.accessToken),
      secureStorage.set(StorageKeys.refreshToken, tokens.refreshToken),
      storage.setJson(StorageKeys.user, user),
    ]);
    set({ user, isAuthenticated: true });
  },

  setUser: async (user) => {
    // Da dang xuat trong luc cho BE tra loi thi khong luu lai tai khoan cua phien cu
    if (!get().isAuthenticated) return;
    await storage.setJson(StorageKeys.user, user);
    set({ user });
  },

  signOut: async () => {
    await Promise.all([
      secureStorage.remove(StorageKeys.accessToken),
      secureStorage.remove(StorageKeys.refreshToken),
      storage.remove(StorageKeys.user),
    ]);
    queryClient.clear();
    set({ user: null, isAuthenticated: false });
  },
}));

// Khi refresh token that bai -> dang xuat toan app
setUnauthorizedHandler(() => {
  void useAuthStore.getState().signOut();
});
