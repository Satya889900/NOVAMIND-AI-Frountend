import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  chatListOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  messageStyle: 'compact' | 'comfortable';
  isLoaderVisible: boolean;
  activeModal: string | null; // 'create_room' | 'profile' etc.
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleChatList: () => void;
  setChatListOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setMessageStyle: (style: 'compact' | 'comfortable') => void;
  showLoader: (visible: boolean) => void;
  openModal: (modalName: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  chatListOpen: true,
  theme: typeof window !== 'undefined' ? (localStorage.getItem('theme') as any) || 'system' : 'system',
  accentColor: typeof window !== 'undefined' ? localStorage.getItem('accentColor') || 'purple' : 'purple',
  fontSize: typeof window !== 'undefined' ? (localStorage.getItem('fontSize') as any) || 'medium' : 'medium',
  messageStyle: typeof window !== 'undefined' ? (localStorage.getItem('messageStyle') as any) || 'compact' : 'compact',
  isLoaderVisible: false,
  activeModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleChatList: () => set((state) => ({ chatListOpen: !state.chatListOpen })),
  setChatListOpen: (open) => set({ chatListOpen: open }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    set({ theme });
  },
  setAccentColor: (color) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accentColor', color);
    }
    set({ accentColor: color });
  },
  setFontSize: (size) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fontSize', size);
    }
    set({ fontSize: size });
  },
  setMessageStyle: (style) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('messageStyle', style);
    }
    set({ messageStyle: style });
  },
  showLoader: (visible) => set({ isLoaderVisible: visible }),
  openModal: (modalName) => set({ activeModal: modalName }),
}));
