import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestId = error.response?.data?.requestId;
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    const messageWithRequestId = requestId
      ? `${message} (Request ID: ${requestId})`
      : message;

    if (status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(new Error(messageWithRequestId));
  }
);
