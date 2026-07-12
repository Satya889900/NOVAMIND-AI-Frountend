/**
 * Message Service — Calls real Express backend via axiosClient
 *
 * GET    /conversations/:roomId/messages  — Load messages for a room
 * POST   /conversations/:roomId/messages  — Send a message to a room
 * PATCH  /messages/:id                    — Edit a message
 * DELETE /messages/:id                    — Delete a message
 */
import axiosClient from '../lib/axios';
import { API_ROUTES } from '../lib/constants';

export interface ChatMessagePayload {
  content: string;
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatMessageResponse {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
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
};
