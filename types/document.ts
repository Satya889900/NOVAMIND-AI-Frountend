export type DocumentStatus = 'Uploaded' | 'Processing' | 'Completed' | 'Ready' | 'Failed';

export interface Document {
  _id: string;
  userId: string;
  conversationId?: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  cloudinaryPublicId: string;
  status: DocumentStatus;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUploadResult {
  document: Document;
  chunksProcessed: number;
}
