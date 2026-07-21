/**
 * Message Service — Calls real Express backend via axiosClient
 *
 * GET    /conversations/:roomId/messages  — Load messages for a room
 * POST   /conversations/:roomId/messages  — Send a message to a room
 * PATCH  /messages/:id                    — Edit a message
 * DELETE /messages/:id                    — Delete a message
 */
import axiosClient, { refreshAccessToken } from '../lib/axios';
import { API_ROUTES } from '../lib/constants';

export interface ChatMessagePayload {
  content: string;
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  model?: string;
}

export interface ChatMessageResponse {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  _id?: string;
  id: string;
  conversationId: string;
  roomId: string;
  senderId: string | { _id?: string; id?: string; name?: string; email?: string; avatarUrl?: string; status?: string };
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  isEdited: boolean;
  sender: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface SendMessageResponse {
  userMessage: ChatMessageResponse;
  aiReply?: ChatMessageResponse;
}

export const messageService = {
  /**
   * POST /conversations/:roomId/messages → http://localhost:5000/api/conversations/:roomId/messages
   */
  sendChatMessage: async (
    roomId: string,
    payload: ChatMessagePayload
  ): Promise<ApiResult<SendMessageResponse>> => {
    const res = await axiosClient.post<ApiResult<SendMessageResponse>>(
      API_ROUTES.MESSAGES.BY_ROOM(roomId),
      payload
    );
    return res.data;
  },

  /**
   * GET /conversations/:roomId/messages → http://localhost:5000/api/conversations/:roomId/messages
   */
  getMessages: async (roomId: string): Promise<ApiResult<MessageResponse[]>> => {
    const res = await axiosClient.get<ApiResult<MessageResponse[]>>(
      API_ROUTES.MESSAGES.BY_ROOM(roomId)
    );
    return res.data;
  },

  /**
   * DELETE /messages/:id → http://localhost:5000/api/messages/:id
   */
  deleteMessage: async (messageId: string): Promise<ApiResult<{ id: string }>> => {
    const res = await axiosClient.delete<ApiResult<{ id: string }>>(
      API_ROUTES.MESSAGES.BY_ID(messageId)
    );
    return res.data;
  },

  /**
   * PATCH /messages/:id → http://localhost:5000/api/messages/:id
   */
  editMessage: async (messageId: string, content: string): Promise<ApiResult<MessageResponse>> => {
    const res = await axiosClient.patch<ApiResult<MessageResponse>>(
      API_ROUTES.MESSAGES.BY_ID(messageId),
      { content }
    );
    return res.data;
  },

  /**
   * SSE Stream POST /conversations/:roomId/messages/stream
   */
  streamChatMessage: async (
    roomId: string,
    payload: ChatMessagePayload,
    onToken: (token: string) => void,
    onDone: (aiMsg: ChatMessageResponse) => void,
    onError: (err: any) => void
  ): Promise<void> => {
    try {
      let token = localStorage.getItem('token');
      // Retrieve Axios base URL, fallback if relative
      let baseUrl = axiosClient.defaults.baseURL || '/api';
      // Ensure we don't end up with /api/api if both are set
      if (typeof window !== 'undefined' && baseUrl.startsWith('/')) {
        baseUrl = window.location.origin + baseUrl;
      }
      const url = `${baseUrl}${API_ROUTES.MESSAGES.BY_ROOM(roomId)}/stream`;

      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // Handle 401 Token Expiry by automatically refreshing token & retrying
      if (response.status === 401) {
        try {
          const newToken = await refreshAccessToken();
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
            },
            body: JSON.stringify(payload),
          });
        } catch {
          // If token refresh fails, proceed to standard error handler below
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errMsg = `HTTP error ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.message) errMsg = parsed.message;
        } catch {}
        throw new Error(errMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        throw new Error('Response body reader is not available');
      }

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep trailing incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.error) {
                onError(new Error(data.error));
              } else if (data.done) {
                onDone(data);
              } else if (data.token !== undefined) {
                onToken(data.token);
              }
            } catch (e) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    } catch (err: any) {
      onError(err);
    }
  },
};
