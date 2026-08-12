import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta?: Record<string, any>,
  statusCode = 200
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  details?: any[],
  statusCode = 400
): Response => {
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details: details || [],
    },
  };
  return res.status(statusCode).json(payload);
};
