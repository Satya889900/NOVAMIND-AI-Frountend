export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  CONVERSATIONS: {
    BASE: '/conversations',
    BY_ID: (id: string) => `/conversations/${id}`,
  },
  MESSAGES: {
    BY_ROOM: (roomId: string) => `/conversations/${roomId}/messages`,
    BY_ID: (messageId: string) => `/messages/${messageId}`,
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
  },
  AI: {
    CHAT: '/ai/chat',
  },
  DOCUMENTS: {
    BASE: '/documents',
    UPLOAD: '/documents/upload',
    BY_ID: (id: string) => `/documents/${id}`,
  },
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SEND_MESSAGE: 'send_message',
  MESSAGE_RECEIVED: 'message_received',
  TYPING: 'typing',
  USER_TYPING: 'user_typing',
  USER_STATUS: 'user_status_changed',
};

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  THEME: 'theme',
  USER: 'user',
};
