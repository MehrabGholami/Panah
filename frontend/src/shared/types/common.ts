export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  code?: string;
  message?: string;
  details?: Record<string, string[]>;
  correlation_id?: string;
}
