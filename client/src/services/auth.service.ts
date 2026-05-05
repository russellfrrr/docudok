import { api } from './api';
import type {
  AuthResponse,
  LoginInput,
  MeResponse,
  RegisterInput,
} from '@/types/auth';

export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', input);
  return response.data;
}

export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', input);
  return response.data;
}

export const getMe = async (): Promise<MeResponse> => {
  const response = await api.get<MeResponse>('/auth/me');
  return response.data;
}