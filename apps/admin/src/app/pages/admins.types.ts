export interface AdminRow {
  id: string;
  email: string;
  status: 'ACTIVE' | 'BLOCKED' | 'INVITED';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminInviteResult {
  inviteToken: string;
}
