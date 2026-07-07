import { api } from './api';
import { API_ROUTES } from '../lib/constants';
import { AuthResponse } from '../types/auth';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { User } from '../types/user';

export const authService = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ROUTES.AUTH.LOGIN, data);
    return res.data;
  },

  register: async (data: Omit<RegisterInput, 'confirmPassword'>): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ROUTES.AUTH.REGISTER, data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await api.post(API_ROUTES.AUTH.LOGOUT);
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>(API_ROUTES.AUTH.ME);
    return res.data;
  },
};
