export type AppRole = 'victim' | 'officer' | 'admin';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AppRole;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  language?: string;
  isApproved?: boolean;
  badgeNumber?: string;
  stationId?: string;
  rank?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSuccessResponse = {
  user: AuthenticatedUser;
  token: string;
  refreshToken: string;
  redirectTo: string;
};
