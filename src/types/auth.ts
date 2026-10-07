export type UserRole = 'agency_dev' | 'builder_designer' | 'store_merchant' | 'custom';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatarColor: string;
  initials: string;
  spaceName?: string;
}

export interface SessionData {
  user: UserProfile | null;
  isAuthenticated: boolean;
  storageType: 'localStorage' | 'sessionStorage';
  lastActive: number;
}
