import { create } from 'zustand';
import { AuthState } from '../types/auth';
import { User } from '../types/user';
import { LoginInput, RegisterInput } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';
import { socketService } from '../services/socket.service';

interface AuthActions {
  login: (data: LoginInput) => Promise<void>;
  register: (data: Omit<RegisterInput, 'confirmPassword'>) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(data);
      
      get().setToken(response.token);
      // Persist refresh token so silent refresh can work
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      
      try {
        socketService.connect(response.token);
      } catch (e) {}
    } catch (err: any) {
      set({
        error: err.message || 'Login failed. Please check credentials.',
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      
      get().setToken(response.token);
      // Persist refresh token so silent refresh can work
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      
      try {
        socketService.connect(response.token);
      } catch (e) {}
    } catch (err: any) {
      set({
        error: err.message || 'Registration failed.',
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore error on logout
    } finally {
      get().setToken(null);
      set({ user: null, isAuthenticated: false });
      try {
        socketService.disconnect();
      } catch (e) {}
    }
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
      try {
        socketService.connect(token);
      } catch (e) {}
    } catch (err) {
      get().setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
