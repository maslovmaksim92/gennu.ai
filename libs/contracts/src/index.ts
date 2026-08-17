export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'BLOCKED' | 'INVITED';
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}
