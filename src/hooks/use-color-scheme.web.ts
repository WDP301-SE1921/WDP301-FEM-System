import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const emptySubscribe = () => () => {};

/**
 * Web ho tro static rendering: luc render tren server chua biet theme cua may khach,
 * nen tra 'light' truoc, sau khi hydrate moi lay gia tri that.
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true, // client
    () => false, // server
  );

  return hasHydrated ? colorScheme : 'light';
}
