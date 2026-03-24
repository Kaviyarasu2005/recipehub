
export type Language = 'English' | 'Spanish' | 'French' | 'Hindi';
export type UserRole = 'Admin' | 'User' | 'Company' | 'Guest';
export type ContentStatus = 'pending' | 'approved' | 'rejected';
export type IndustryType = 'Hotel' | 'Restaurant' | 'Catering' | 'Bakery' | 'Other';

export interface InstructionStep {
  title: string;
  text: string;
}

export interface CompanyDetails {
  industry: IndustryType;
  description: string;
  location: string;
  contactNumber: string;
  hrName: string;
  logo?: string;
}

export interface UserNotification {
  id: string;
  recipientId: string | 'all';
  senderName: string;
  title: string;
  message: string;
  time: string;
  type: 'system' | 'warning' | 'announcement';
  read: boolean;
}

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  companyIndustry?: IndustryType;
  title: string;
  description: string;
  skills: string[];
  salary: string;
  jobType: 'Full-time' | 'Part-time';
  workingHours: string;
  weeklyOff: string;
  location: string;
  experience: string;
  contactMethod: string;
  status: ContentStatus;
  postedAt: string;
  lastDate: string; // Mandatory deadline field
  applicantIds: string[]; // Track user IDs who applied
}

export interface Video {
  id: string;
  title: string;
  creator: string;
  views: string;
  postedTime: string;
  duration: string;
  thumbnail: string;
  thumbnail_url?: string;
  category: string;
  creator_avatar?: string;
  creator_Avatar?: string;
  creatorAvatar?: string;
  creator_id?: string;
  likes?: string;
  isVerified?: boolean;
  rating?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  timeMinutes?: number;
  watchedProgress?: number;
  isTrending?: boolean;
  ingredients?: string[];
  instructions?: InstructionStep[];
  description?: string;
  video_url?: string;
  status: ContentStatus;
}

export interface UserStats {
  videos: number;
  followers: number;
  following: number;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  role: UserRole;
  bio: string;
  avatar: string;
  stats: UserStats;
  email?: string;
  followerList?: string[];
  followingList?: string[];
  speciality?: string;
  isVerified?: boolean;
  isBlocked?: boolean;
  companyDetails?: CompanyDetails;
}

export type Page =
  | 'home'
  | 'search'
  | 'profile'
  | 'splash'
  | 'login'
  | 'adminLogin'
  | 'signup'
  | 'upload'
  | 'notifications'
  | 'recipeDetail'
  | 'jobs'
  | 'adminDashboard'
  | 'companyDashboard'
  | 'help'
  | 'about'
  | (string & {});
