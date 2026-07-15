import { api } from './api';

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}

export interface ProviderStatus {
  id: string;
  name: string;
  configured: boolean;
  models: ModelOption[];
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  systemInstructions: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  createdAt?: string;
  updatedAt?: string;
}

export const settingsService = {
  getProviders: async (): Promise<ProviderStatus[]> => {
    const res = await api.get<{ providers: ProviderStatus[] }>('/settings/providers');
    return (res.data as any).providers;
  },

  getSettings: async (): Promise<UserSettings> => {
    const res = await api.get<UserSettings>('/settings');
    return res.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const res = await api.put<UserSettings>('/settings', settings);
    return res.data;
  },
};
