/**
 * Document Service — Calls real Express backend via axiosClient
 *
 * POST   /documents/upload  — Upload a document
 * GET    /documents          — List all documents for logged-in user
 * GET    /documents/:id      — Get a single document by ID
 * DELETE /documents/:id      — Delete a document
 */
import axiosClient from '../lib/axios';
import { API_ROUTES } from '../lib/constants';
import { Document, DocumentUploadResult } from '../types/document';

export interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const documentService = {
  /**
   * POST /documents/upload — multipart/form-data upload
   */
  uploadDocument: async (
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResult<Document>> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axiosClient.post<ApiResult<Document>>(
      API_ROUTES.DOCUMENTS.UPLOAD,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    );
    return res.data;
  },

  /**
   * GET /documents
   */
  getDocuments: async (): Promise<ApiResult<Document[]>> => {
    const res = await axiosClient.get<ApiResult<Document[]>>(API_ROUTES.DOCUMENTS.BASE);
    return res.data;
  },

  /**
   * GET /documents/:id
   */
  getDocumentById: async (id: string): Promise<ApiResult<Document>> => {
    const res = await axiosClient.get<ApiResult<Document>>(API_ROUTES.DOCUMENTS.BY_ID(id));
    return res.data;
  },

  /**
   * DELETE /documents/:id
   */
  deleteDocument: async (id: string): Promise<ApiResult<{ id: string }>> => {
    const res = await axiosClient.delete<ApiResult<{ id: string }>>(
      API_ROUTES.DOCUMENTS.BY_ID(id)
    );
    return res.data;
  },
};
