import axios from 'axios';

export interface HealthResponse {
  message: string;
  service: string;
  timestamp: string;
}

const healthApi = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1')
    .replace(/\/api\/v1$/, '/api'),
});

export const getHealth = async (): Promise<HealthResponse> => {
  const response = await healthApi.get<HealthResponse>('/health');

  return response.data;
};
