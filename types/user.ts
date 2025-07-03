export interface User {
  id: number;
  username: string;
  password: string;
  fullName: string;
  role: 'manager' | 'director';
  section?: string;
  createdAt: string;
  isActive: boolean;
}

export interface UserFormData {
  username: string;
  password: string;
  fullName: string;
  role: 'manager' | 'director';
  section: string;
  isActive: boolean;
} 