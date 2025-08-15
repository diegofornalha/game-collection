import type { DailyStreakData } from '@/types/gamification.types';

export interface XPCalculationResult {
  baseXP: number;
  bonuses: {
    time: number;
    combo: number;
    perfect: number;
    streak: number;
    difficulty: number;
  };
  totalXP: number;
  breakdown: string[];
}

export interface GameStats {
  timeInSeconds: number;
  maxCombo: number;
  hintsUsed: number;
  undoCount: number;
  score: number;
  remainingTiles: number;
  layoutId: string;
}

export class XPCalculatorService {
  // XP Constants
  private readonly BASE_XP_PER_MATCH = 10;
  private readonly BASE_WIN_XP = 200;
  private readonly PERFECT_GAME_MULTIPLIER = 1.5;
  
  // Time multipliers (in seconds)
  private readonly TIME_THRESHOLDS = [
    { time: 300, multiplier: 2.0 },    // < 5 minutes
    { time: 600, multiplier: 1.5 },    // < 10 minutes
    { time: 900, multiplier: 1.2 },    // < 15 minutes
    { time: 1200, multiplier: 1.0 },   // < 20 minutes
    { time: Infinity, multiplier: 0.8 } // > 20 minutes
  ];
  
  // Layout difficulty multipliers
  private readonly LAYOUT_MULTIPLIERS: Record<string, number> = {
    'easy': 1.0,
    'medium': 1.2,
    'hard': 1.4,
    'expert': 1.6,
    'default': 1.2
  };

  /**
   * Calculate XP for a single tile match
   */
  calculateMatchXP(combo: number = 0, remainingTiles: number): number {
    let xp = this.BASE_XP_PER_MATCH;
    
    // Combo bonus: +10% per combo
    if (combo > 0) {
      xp *= (1 + (combo * 0.1));
    }
    
    // End game bonus: +20% when less than 10 tiles remain
    if (remainingTiles <= 10) {
      xp *= 1.2;
    }
    
    return Math.round(xp);
  }

  /**
   * Calculate XP for winning the game
   */
  calculateWinXP(stats: GameStats, streakData?: DailyStreakData): XPCalculationResult {
    const breakdown: string[] = [];
    let baseXP = this.BASE_WIN_XP;
    
    // Calculate bonuses
    const timeBonus = this.calculateTimeBonus(stats.timeInSeconds);
    const comboBonus = this.calculateComboBonus(stats.maxCombo);
    const perfectBonus = this.calculatePerfectGameBonus(stats.hintsUsed, stats.undoCount);
    const streakBonus = this.calculateStreakBonus(streakData);
    const difficultyBonus = this.calculateDifficultyBonus(stats.layoutId);
    
    // Apply bonuses
    const bonuses = {
      time: Math.round(baseXP * (timeBonus - 1)),
      combo: Math.round(baseXP * (comboBonus - 1)),
      perfect: Math.round(baseXP * (perfectBonus - 1)),
      streak: Math.round(baseXP * (streakBonus - 1)),
      difficulty: Math.round(baseXP * (difficultyBonus - 1))
    };
    
    // Calculate total
    const totalMultiplier = timeBonus * comboBonus * perfectBonus * streakBonus * difficultyBonus;
    const totalXP = Math.round(baseXP * totalMultiplier);
    
    // Build breakdown
    breakdown.push(`XP Base: ${baseXP}`);
    if (bonuses.time > 0) breakdown.push(`Bônus de Tempo: +${bonuses.time}`);
    if (bonuses.combo > 0) breakdown.push(`Bônus de Combo: +${bonuses.combo}`);
    if (bonuses.perfect > 0) breakdown.push(`Jogo Perfeito: +${bonuses.perfect}`);
    if (bonuses.streak > 0) breakdown.push(`Bônus de Ofensiva: +${bonuses.streak}`);
    if (bonuses.difficulty > 0) breakdown.push(`Bônus de Dificuldade: +${bonuses.difficulty}`);
    breakdown.push(`Total: ${totalXP} XP`);
    
    return {
      baseXP,
      bonuses,
      totalXP,
      breakdown
    };
  }

  /**
   * Calculate XP required for next level
   */
  calculateXPForLevel(level: number): number {
    // Progressive curve: base * level^1.5 * acceleration
    const base = 100;
    const exponent = 1.5;
    const acceleration = Math.floor(level / 10) * 0.1 + 1; // +10% every 10 levels
    
    return Math.round(base * Math.pow(level, exponent) * acceleration);
  }

  /**
   * Calculate current level from total XP
   */
  calculateLevelFromXP(totalXP: number): { level: number; currentXP: number; nextLevelXP: number } {
    let level = 1;
    let xpForCurrentLevel = 0;
    let xpForNextLevel = this.calculateXPForLevel(level + 1);
    
    while (totalXP >= xpForNextLevel) {
      level++;
      xpForCurrentLevel = xpForNextLevel;
      xpForNextLevel += this.calculateXPForLevel(level + 1);
    }
    
    return {
      level,
      currentXP: totalXP - xpForCurrentLevel,
      nextLevelXP: this.calculateXPForLevel(level + 1)
    };
  }

  private calculateTimeBonus(seconds: number): number {
    const threshold = this.TIME_THRESHOLDS.find(t => seconds < t.time);
    return threshold?.multiplier || 0.8;
  }

  private calculateComboBonus(maxCombo: number): number {
    // Up to 50% bonus for high combos
    return 1 + Math.min(maxCombo * 0.05, 0.5);
  }

  private calculatePerfectGameBonus(hintsUsed: number, undoCount: number): number {
    return (hintsUsed === 0 && undoCount === 0) ? this.PERFECT_GAME_MULTIPLIER : 1.0;
  }

  private calculateStreakBonus(streakData?: DailyStreakData): number {
    if (!streakData || streakData.currentStreak === 0) return 1.0;
    
    // +5% per day, max 50%
    const bonus = Math.min(streakData.currentStreak * 0.05, 0.5);
    return 1 + bonus;
  }

  private calculateDifficultyBonus(layoutId: string): number {
    return this.LAYOUT_MULTIPLIERS[layoutId] || this.LAYOUT_MULTIPLIERS.default;
  }
}

export const xpCalculatorService = new XPCalculatorService();