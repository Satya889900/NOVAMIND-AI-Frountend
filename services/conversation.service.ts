/**
 * Conversation Service — Calls real Express backend via axiosClient
 *
 * POST /conversations        — Create a new conversation
 * GET  /conversations        — List all conversations for the logged-in user
 * GET  /conversations/:id    — Get a single conversation
 * PUT  /conversations/:id    — Rename a conversation
 * DELETE /conversations/:id  — Delete a conversation
 */
import axiosClient from '../lib/axios';
import { API_ROUTES } from '../lib/constants';

export interface CreateConversationPayload {
  name?: string;
  isGroup?: boolean;
  participantIds?: string[];
  documentId?: string;
}

export interface ConversationParticipant {
  _id: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: string;
}

export interface ConversationResponse {
  _id: string;
  name: string;
  isGroup: boolean;
  avatarUrl: string;
  participants: ConversationParticipant[];
  documentId?: string;
  lastMessage?: {
    _id: string;
    content: string;
    senderId: string;
    type?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const conversationService = {
  /**
   * POST /conversations → http://localhost:5000/api/conversations
   */
  createConversation: async (
    payload: CreateConversationPayload
  ): Promise<ApiResult<ConversationResponse>> => {
    const res = await axiosClient.post<ApiResult<ConversationResponse>>(
      API_ROUTES.CONVERSATIONS.BASE,
      payload
    );
    return res.data;
  },

  /**
   * GET /conversations → http://localhost:5000/api/conversations
   */
  getConversations: async (): Promise<ApiResult<ConversationResponse[]>> => {
    const res = await axiosClient.get<ApiResult<ConversationResponse[]>>(
      API_ROUTES.CONVERSATIONS.BASE
    );
    return res.data;
  },

  /**
   * GET /conversations/:id → http://localhost:5000/api/conversations/:id
   */
  getConversationById: async (id: string): Promise<ApiResult<ConversationResponse>> => {
    const res = await axiosClient.get<ApiResult<ConversationResponse>>(
      API_ROUTES.CONVERSATIONS.BY_ID(id)
    );
    return res.data;
  },

  /**
   * PATCH /conversations/:id → http://localhost:5000/api/conversations/:id
   */
  renameConversation: async (id: string, name: string): Promise<ApiResult<ConversationResponse>> => {
    const res = await axiosClient.patch<ApiResult<ConversationResponse>>(
      API_ROUTES.CONVERSATIONS.BY_ID(id),
      { name }
    );
    return res.data;
  },

  /**
   * DELETE /conversations/:id → http://localhost:5000/api/conversations/:id
   */
  deleteConversation: async (id: string): Promise<ApiResult<{ id: string }>> => {
    const res = await axiosClient.delete<ApiResult<{ id: string }>>(
      API_ROUTES.CONVERSATIONS.BY_ID(id)
    );
    return res.data;
  },
};
