import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((module) => ({
    default: module.LoginPage,
  }))
);
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  }))
);
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
);
const DocumentChatPage = lazy(() =>
  import('@/pages/DocumentChatPage').then((module) => ({
    default: module.DocumentChatPage,
  }))
);

export const App = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

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
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-muted text-sm text-muted-foreground">
          Loading...
        </main>
      }
    >
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
