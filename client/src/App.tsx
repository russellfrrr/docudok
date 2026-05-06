import { Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DocumentChatPage } from '@/pages/DocumentChatPage';

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
  );
}