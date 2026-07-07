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
      const res = await authService.login(data);
      get().setToken(res.token);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
      socketService.connect(res.token);
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Login failed. Please check credentials.',
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.register(data);
      get().setToken(res.token);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
      socketService.connect(res.token);
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Registration failed.',
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
      socketService.disconnect();
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
      socketService.connect(token);
    } catch (err) {
      get().setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
