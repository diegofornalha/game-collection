// Gamification type definitions

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  experiencePoints: number;
  totalExperience: number;
  tokens: number;
  achievements: Achievement[];
  stats: UserStats;
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
  maxProgress?: number; // For compatibility
  rewards?: {
    tokens?: number;
    experience?: number;
  };
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalTimePlayed: number;
  averageGameTime: number;
  bestTime?: number;
  currentStreak: number;
  longestStreak: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  notifications: boolean;
  language: string;
}

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  isVacationMode: boolean;
  vacationStartDate?: string;
  vacationEndDate?: string;
  rewardsEarned: StreakReward[];
}

export interface VacationMode {
  isActive: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  maxDays: number;
}

export interface StreakReward {
  day: number;
  tokens: number;
  experience: number;
  achievement?: string;
  special?: string;
  xp?: number;
  bonus?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'achievement' | 'special';
  rules: ChallengeRule[];
  reward: ChallengeReward;
  progress: number;
  target: number;
  expiresAt?: Date;
  completedAt?: Date;
}

export interface ChallengeRule {
  id: string;
  name: string;
  type: 'noUndo' | 'noHints' | 'timeLimit' | 'minScore' | 'perfectGame' | 'speedRun' | 'custom';
  description: string;
  value?: any;
  validate: (context: GameContext) => boolean;
  multiplier?: number;
  validator?: (context: GameContext) => boolean;
}

export interface ChallengeReward {
  tokens: number;
  experience: number;
  achievement?: string;
  multiplier?: number;
}

export interface ChallengeProgress {
  challengeId: string;
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
  lastUpdated: Date;
}

export interface GameContext {
  gameWon: boolean;
  gameCompleted?: boolean;
  movesCount: number;
  timeElapsed: number;
  timeTaken?: number;
  hintsUsed: number;
  undoUsed: number;
  undoCount?: number;
  score: number;
  perfectGame: boolean;
  wrongMatches?: number;
  matchCount?: number;
  maxCombo?: number;
  metadata?: any;
}

export type ChallengeCategory = 'basic' | 'mastery' | 'perfection' | 'special';

export type ChallengeValidation = GameContext;

// Type aliases for compatibility
export type DailyStreakData = DailyStreak;
export type UserAchievement = Achievement;