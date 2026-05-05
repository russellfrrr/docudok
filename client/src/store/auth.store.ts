import { create } from 'zustand';
import type { User } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const storedToken = localStorage.getItem('token');

export const useAuthStore = create<AuthState>((set) => ({
  token: storedToken,
  user: null,

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },

  setUser: (user) => {
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));