export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<PaginatedData<T>> {}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  department_id?: number | string;
  position_id?: number | string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
