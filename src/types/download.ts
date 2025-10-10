export interface DownloadOptions {
  filename?: string;
  contentType?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  progress: number;
}

export interface DownloadError extends Error {
  code?: string;
  details?: Record<string, unknown>;
}

export interface DownloadResult {
  success: boolean;
  filename: string;
  size?: number;
  error?: DownloadError;
}