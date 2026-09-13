import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { StorageKey } from '@/constants/storage-keys';

import { logger } from './logger';

const isWeb = Platform.OS === 'web';

/**
 * Luu du lieu nhay cam (token). Tren native dung Keychain/Keystore,
 * tren web fallback ve AsyncStorage vi SecureStore khong ho tro web.
 */
export const secureStorage = {
  async get(key: StorageKey): Promise<string | null> {
    try {
      return isWeb ? await AsyncStorage.getItem(key) : await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error('secureStorage.get', key, error);
      return null;
    }
  },

  async set(key: StorageKey, value: string): Promise<void> {
    try {
      if (isWeb) await AsyncStorage.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error('secureStorage.set', key, error);
    }
  },

  async remove(key: StorageKey): Promise<void> {
    try {
      if (isWeb) await AsyncStorage.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error('secureStorage.remove', key, error);
    }
  },
};

/** Luu du lieu thuong (setting, cache nho). */
export const storage = {
  async getJson<T>(key: StorageKey): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      logger.error('storage.getJson', key, error);
      return null;
    }
  },

  async setJson(key: StorageKey, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error('storage.setJson', key, error);
    }
  },

  async remove(key: StorageKey): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
