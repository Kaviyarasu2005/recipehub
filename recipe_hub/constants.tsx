import { Video, UserProfile, Job } from './types';

export const COLORS = {
  primary: '#F6CEFC',
  accent: '#a832d3',
  card: '#ffffff',
  textPrimary: '#1a0e1b',
  textSecondary: '#665d68'
};

export const CATEGORIES = [
  'Popular', 'Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Vegetarian', 'Vegan', 'Quick & Easy'
];

// No mock/dummy data — data comes from backend API. Empty arrays for type-safe defaults.
export const EMPTY_VIDEOS: Video[] = [];
export const EMPTY_JOBS: Job[] = [];
export const EMPTY_USER_PROFILES: UserProfile[] = [];
