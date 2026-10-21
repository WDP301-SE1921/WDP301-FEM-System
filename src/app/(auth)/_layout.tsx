import { Redirect, Stack } from 'expo-router';

import { getPostSignInHref, useAuth } from '@/features/auth';

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuth();

  // Da dang nhap thi khong vao lai man hinh login/register. Cung dich voi dieu huong sau khi dang
  // nhap trong `useLogin`, `useRegister` de hai noi khong keo nguoi dung ve hai man hinh khac nhau.
  if (isAuthenticated && user) return <Redirect href={getPostSignInHref(user)} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
