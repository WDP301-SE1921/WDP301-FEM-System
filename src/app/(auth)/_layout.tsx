import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  // Da dang nhap thi khong vao lai man hinh login/register
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
