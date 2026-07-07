export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiError {
  message: string;
  errors?: { [key: string]: string[] };
  statusCode: number;
}
