import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth';

/** Cong vao: dieu huong theo trang thai dang nhap. */
export default function Index() {
  const { isAuthenticated } = useAuth();

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/welcome'} />;
}
