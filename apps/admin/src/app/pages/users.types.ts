export interface UserRow {
  id: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED' | 'INVITED';
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
