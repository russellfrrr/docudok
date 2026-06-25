import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { PageLoading } from '@/components/layout';

const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((module) => ({
    default: module.LoginPage,
  }))
);
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  }))
);
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
);
const DocumentChatPage = lazy(() =>
  import('@/pages/documents/DocumentChatPage').then((module) => ({
    default: module.DocumentChatPage,
  }))
);

export const App = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const data = await getMe();
      setUser(data.user);
      return data.user;
    },
    enabled: Boolean(token),
  });

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route
          path="/"
          element={token ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={token ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/" /> : <RegisterPage />}
        />
        <Route
          path="/documents/:documentId"
          element={token ? <DocumentChatPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </Suspense>
  );
};
