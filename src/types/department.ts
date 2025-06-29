export interface Department {
  id: string;
  name: string;
  description?: string;
  order?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentFormData {
  id?: string;
  name: string;
  description?: string;
  order?: number;
  is_active?: boolean;
}

export interface DepartmentResponse {
  data: Department[];
  error: Error | null;
} 