import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  isLoaderVisible: boolean;
  activeModal: string | null; // 'create_room' | 'profile' etc.
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  showLoader: (visible: boolean) => void;
  openModal: (modalName: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  theme: typeof window !== 'undefined' ? (localStorage.getItem('theme') as any) || 'system' : 'system',
  isLoaderVisible: false,
  activeModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    set({ theme });
  },
  showLoader: (visible) => set({ isLoaderVisible: visible }),
  openModal: (modalName) => set({ activeModal: modalName }),
}));
