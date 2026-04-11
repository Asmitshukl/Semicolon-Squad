export type UserRole = 'victim' | 'officer' | 'admin';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type OfficerRank =
  | 'Constable'
  | 'Head Constable'
  | 'Assistant Sub-Inspector'
  | 'Sub-Inspector'
  | 'Inspector'
  | 'Deputy Superintendent'
  | 'Superintendent';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  gender?: Gender;
  language?: string;
  isApproved?: boolean;
  badgeNumber?: string;
  stationId?: string;
  rank?: OfficerRank;
  createdAt?: string;
  updatedAt?: string;
}