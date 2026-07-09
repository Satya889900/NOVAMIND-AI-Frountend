import axiosClient from '../lib/axios';
import { API_ROUTES } from '../lib/constants';
import { AuthResponse } from '../types/auth';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { User } from '../types/user';

export const authService = {
  /**
   * POST /auth/login  →  http://localhost:5000/api/auth/login
   */
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const res = await axiosClient.post<{ 
      success: boolean; 
      message: string; 
      data: { user: any; accessToken?: string; token?: string; refreshToken?: string } 
    }>(
      API_ROUTES.AUTH.LOGIN,
      data
    );
    const responseData = res.data.data;
    return {
      user: responseData.user,
      token: responseData.token || responseData.accessToken || '',
      refreshToken: responseData.refreshToken,
    };
  },

  /**
   * POST /auth/register  →  http://localhost:5000/api/auth/register
   */
  register: async (data: Omit<RegisterInput, 'confirmPassword'>): Promise<AuthResponse> => {
    const res = await axiosClient.post<{ 
      success: boolean; 
      message: string; 
      data: { user: any; accessToken?: string; token?: string; refreshToken?: string } 
    }>(
      API_ROUTES.AUTH.REGISTER,
      data
    );
    const responseData = res.data.data;
    return {
      user: responseData.user,
      token: responseData.token || responseData.accessToken || '',
      refreshToken: responseData.refreshToken,
    };
  },

  /**
   * POST /auth/logout  →  http://localhost:5000/api/auth/logout
   */
  logout: async (): Promise<void> => {
    await axiosClient.post(API_ROUTES.AUTH.LOGOUT);
  },

  /**
   * GET /auth/me  →  http://localhost:5000/api/auth/me
   * Token is automatically injected by axiosClient request interceptor.
   */
  getMe: async (): Promise<User> => {
    const res = await axiosClient.get<{ success: boolean; data: User }>(API_ROUTES.AUTH.ME);
    return res.data.data;
  },
};
