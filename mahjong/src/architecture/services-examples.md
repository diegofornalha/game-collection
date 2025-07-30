# Services do Sistema de Ofensiva Diária

## 📅 DateService

```typescript
// services/date.service.ts
export class DateService {
  /**
   * Get today's date at midnight (start of day)
   */
  getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  
  /**
   * Get tomorrow's date at midnight
   */
  getTomorrow(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
  
  /**
   * Check if two dates are the same day
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  /**
   * Check if date2 is exactly one day after date1
   */
  isConsecutiveDay(date1: Date, date2: Date): boolean {
    const day1 = new Date(date1);
    day1.setHours(0, 0, 0, 0);
    
    const day2 = new Date(date2);
    day2.setHours(0, 0, 0, 0);
    
    const diffTime = day2.getTime() - day1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 1;
  }
  
  /**
   * Get a unique key for a date (YYYY-MM-DD)
   */
  getDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Parse a date key back to Date
   */
  parseDateKey(key: string): Date {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  /**
   * Get the start of the current week (Sunday)
   */
  getWeekStart(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }
  
  /**
   * Get the start of the current month
   */
  getMonthStart(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }
  
  /**
   * Format date for display
   */
  formatDate(date: Date, locale: string = 'pt-BR'): string {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  /**
   * Get relative time string (e.g., "2 hours ago")
   */
  getRelativeTime(date: Date, locale: string = 'pt-BR'): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else if (diffMins > 0) {
      return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
    } else {
      return 'agora mesmo';
    }
  }
  
  /**
   * Get calendar data for a month
   */
  getMonthCalendar(year: number, month: number): Date[][] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    const current = new Date(startDate);
    while (current <= lastDay || currentWeek.length > 0) {
      currentWeek.push(new Date(current));
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return weeks;
  }
}

export const dateService = new DateService();
```

## 🔧 Enhanced StorageService

```typescript
// services/storage.service.ts
interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('LocalStorage full or unavailable:', e);
    }
  }
  
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
  }
  
  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Silent fail
    }
  }
}

class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>();
  
  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }
  
  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }
  
  removeItem(key: string): void {
    this.storage.delete(key);
  }
  
  clear(): void {
    this.storage.clear();
  }
}

export class StorageService {
  private adapter: StorageAdapter;
  private prefix: string = 'mahjong_';
  private cache = new Map<string, any>();
  
  constructor() {
    // Use localStorage if available, fallback to memory
    this.adapter = this.isLocalStorageAvailable() 
      ? new LocalStorageAdapter() 
      : new MemoryStorageAdapter();
  }
  
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
  
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }
      
      const data = this.adapter.getItem(this.getKey(key));
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      
      // Handle expiration
      if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
        await this.delete(key);
        return null;
      }
      
      const value = parsed.value;
      this.cache.set(key, value);
      return value;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }
  
  async save<T>(key: string, value: T, expiresInMinutes?: number): Promise<void> {
    try {
      const data: any = { value };
      
      if (expiresInMinutes) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
        data.expiresAt = expiresAt.toISOString();
      }
      
      this.adapter.setItem(this.getKey(key), JSON.stringify(data));
      this.cache.set(key, value);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }
  
  async delete(key: string): Promise<void> {
    this.adapter.removeItem(this.getKey(key));
    this.cache.delete(key);
  }
  
  async clear(): Promise<void> {
    // Only clear our prefixed keys
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      this.adapter.removeItem(key);
    });
    
    this.cache.clear();
  }
  
  // Batch operations for performance
  async getBatch<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    await Promise.all(keys.map(async (key) => {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }));
    
    return results;
  }
  
  async saveBatch<T>(items: Array<{ key: string; value: T; expiresInMinutes?: number }>): Promise<void> {
    await Promise.all(items.map(item => 
      this.save(item.key, item.value, item.expiresInMinutes)
    ));
  }
  
  // Storage size management
  getStorageSize(): number {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }
    
    return totalSize;
  }
  
  // Export/Import for backup
  async exportData(): Promise<string> {
    const data: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          data[key.replace(this.prefix, '')] = JSON.parse(value);
        }
      }
    }
    
    return JSON.stringify(data, null, 2);
  }
  
  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      for (const [key, value] of Object.entries(data)) {
        await this.save(key, value);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
```

## 🎯 Rule Plugin System

```typescript
// services/rule-plugins/index.ts
import type { IChallengeRule, RuleConfig } from '@/types/challenges.types';
import { RulesEngine } from '../rules.engine';

export interface RulePlugin {
  name: string;
  version: string;
  rules: Array<{
    type: string;
    factory: (config: RuleConfig) => IChallengeRule;
  }>;
}

// Advanced rules plugin
export const advancedRulesPlugin: RulePlugin = {
  name: 'advanced-rules',
  version: '1.0.0',
  rules: [
    {
      type: 'pattern-sequence',
      factory: (config) => ({
        type: 'pattern-sequence',
        evaluate: (context) => {
          const sequence = config.sequence as string[];
          const matched = context.matchedTiles as string[] || [];
          
          // Check if the sequence appears in order
          let sequenceIndex = 0;
          for (const tile of matched) {
            if (tile === sequence[sequenceIndex]) {
              sequenceIndex++;
              if (sequenceIndex === sequence.length) {
                return true;
              }
            }
          }
          return false;
        },
        getDescription: () => 
          `Combine tiles in sequence: ${(config.sequence as string[]).join(' → ')}`
      })
    },
    {
      type: 'time-attack',
      factory: (config) => ({
        type: 'time-attack',
        evaluate: (context) => {
          const intervals = config.intervals as Array<{ start: number; end: number; moves: number }>;
          const moveTimestamps = context.moveTimestamps || [];
          
          for (const interval of intervals) {
            const movesInInterval = moveTimestamps.filter(
              ts => ts >= interval.start * 1000 && ts <= interval.end * 1000
            ).length;
            
            if (movesInInterval < interval.moves) {
              return false;
            }
          }
          return true;
        },
        getDescription: () => 'Complete time-based challenges'
      })
    },
    {
      type: 'efficiency',
      factory: (config) => ({
        type: 'efficiency',
        evaluate: (context) => {
          const totalTiles = config.totalTiles || 144;
          const efficiency = (context.score / context.movesCount) / totalTiles;
          return efficiency >= config.minEfficiency;
        },
        getDescription: () => 
          `Achieve ${(config.minEfficiency * 100).toFixed(0)}% efficiency`
      })
    }
  ]
};

// Seasonal rules plugin
export const seasonalRulesPlugin: RulePlugin = {
  name: 'seasonal-rules',
  version: '1.0.0',
  rules: [
    {
      type: 'holiday-tiles',
      factory: (config) => ({
        type: 'holiday-tiles',
        evaluate: (context) => {
          const holidayTiles = ['season_spring', 'season_summer', 'season_autumn', 'season_winter'];
          const matched = context.matchedTiles || [];
          const holidayMatches = matched.filter(t => holidayTiles.includes(t)).length;
          return holidayMatches >= config.minMatches;
        },
        getDescription: () => 
          `Match ${config.minMatches} seasonal tiles`
      })
    },
    {
      type: 'event-bonus',
      factory: (config) => ({
        type: 'event-bonus',
        evaluate: (context) => {
          const eventDate = new Date(config.eventDate);
          const today = new Date();
          
          // Check if today is the event date
          if (today.toDateString() === eventDate.toDateString()) {
            return context.score >= config.bonusScore;
          }
          return context.score >= config.normalScore;
        },
        getDescription: () => {
          const eventDate = new Date(config.eventDate);
          const today = new Date();
          
          if (today.toDateString() === eventDate.toDateString()) {
            return `Special event! Score ${config.bonusScore} points`;
          }
          return `Score ${config.normalScore} points`;
        }
      })
    }
  ]
};

// Plugin manager
export class RulePluginManager {
  private plugins: Map<string, RulePlugin> = new Map();
  
  registerPlugin(plugin: RulePlugin, rulesEngine: RulesEngine) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} already registered`);
      return;
    }
    
    this.plugins.set(plugin.name, plugin);
    
    // Register all rules from the plugin
    plugin.rules.forEach(rule => {
      rulesEngine.registerRule(rule.type, rule.factory);
    });
    
    console.log(`Registered plugin: ${plugin.name} v${plugin.version}`);
  }
  
  unregisterPlugin(pluginName: string) {
    this.plugins.delete(pluginName);
  }
  
  getPlugin(pluginName: string): RulePlugin | undefined {
    return this.plugins.get(pluginName);
  }
  
  listPlugins(): Array<{ name: string; version: string; ruleCount: number }> {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      ruleCount: plugin.rules.length
    }));
  }
}
```

## 🎮 GameContext Service

```typescript
// services/game-context.service.ts
import { useGameStore } from '@/stores/game.store';
import type { ChallengeContext } from '@/types/challenges.types';

export class GameContextService {
  private moveTimestamps: number[] = [];
  private matchedTiles: string[] = [];
  private comboCount: number = 0;
  private lastMoveTime: number = 0;
  
  constructor() {
    this.reset();
  }
  
  reset() {
    this.moveTimestamps = [];
    this.matchedTiles = [];
    this.comboCount = 0;
    this.lastMoveTime = 0;
  }
  
  recordMove(tile1Type: string, tile2Type: string) {
    const now = Date.now();
    this.moveTimestamps.push(now);
    this.matchedTiles.push(tile1Type, tile2Type);
    
    // Calculate combo
    if (this.lastMoveTime > 0) {
      const timeDiff = now - this.lastMoveTime;
      if (timeDiff <= 3000) { // 3 seconds for combo
        this.comboCount++;
      } else {
        this.comboCount = 1;
      }
    } else {
      this.comboCount = 1;
    }
    
    this.lastMoveTime = now;
  }
  
  getCurrentContext(): ChallengeContext {
    const gameStore = useGameStore();
    
    return {
      score: gameStore.score,
      timeInSeconds: gameStore.timer,
      movesCount: gameStore.moves.length,
      hintsUsed: 0, // TODO: Track this in game store
      undoCount: gameStore.undoStack.length,
      comboStreak: this.comboCount,
      moveTimestamps: [...this.moveTimestamps],
      matchedTiles: [...this.matchedTiles],
      completed: gameStore.isGameComplete,
      layoutName: gameStore.currentLayout
    };
  }
  
  getMaxCombo(): number {
    // Calculate max combo from move timestamps
    let maxCombo = 0;
    let currentCombo = 1;
    
    for (let i = 1; i < this.moveTimestamps.length; i++) {
      const timeDiff = this.moveTimestamps[i] - this.moveTimestamps[i-1];
      if (timeDiff <= 3000) {
        currentCombo++;
        maxCombo = Math.max(maxCombo, currentCombo);
      } else {
        currentCombo = 1;
      }
    }
    
    return maxCombo;
  }
  
  getTileTypeDistribution(): Map<string, number> {
    const distribution = new Map<string, number>();
    
    this.matchedTiles.forEach(tile => {
      const count = distribution.get(tile) || 0;
      distribution.set(tile, count + 1);
    });
    
    return distribution;
  }
  
  getAverageTimePerMove(): number {
    if (this.moveTimestamps.length < 2) return 0;
    
    const totalTime = this.moveTimestamps[this.moveTimestamps.length - 1] - this.moveTimestamps[0];
    return totalTime / (this.moveTimestamps.length - 1);
  }
}

export const gameContextService = new GameContextService();
```

## 🔔 Notification Service

```typescript
// services/notification.service.ts
export interface GameNotification {
  id: string;
  type: 'achievement' | 'reward' | 'challenge' | 'streak' | 'level' | 'info';
  title: string;
  message: string;
  icon?: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

export class NotificationService {
  private queue: GameNotification[] = [];
  private isProcessing = false;
  private currentNotification: GameNotification | null = null;
  
  show(notification: Omit<GameNotification, 'id'>) {
    const fullNotification: GameNotification = {
      ...notification,
      id: crypto.randomUUID(),
      duration: notification.duration || 3000
    };
    
    this.queue.push(fullNotification);
    this.processQueue();
  }
  
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      this.currentNotification = this.queue.shift()!;
      
      // Emit event for Vue component to display
      window.dispatchEvent(new CustomEvent('game-notification', {
        detail: this.currentNotification
      }));
      
      // Wait for duration
      await new Promise(resolve => 
        setTimeout(resolve, this.currentNotification.duration)
      );
      
      // Small gap between notifications
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    this.currentNotification = null;
    this.isProcessing = false;
  }
  
  // Preset notifications
  showAchievement(title: string, description: string) {
    this.show({
      type: 'achievement',
      title: '🏆 Conquista Desbloqueada!',
      message: `${title}: ${description}`,
      icon: 'fa-trophy',
      duration: 5000
    });
  }
  
  showStreakMilestone(days: number) {
    this.show({
      type: 'streak',
      title: `🔥 ${days} Dias de Ofensiva!`,
      message: `Parabéns! Você manteve sua ofensiva por ${days} dias consecutivos!`,
      icon: 'fa-fire',
      duration: 5000
    });
  }
  
  showLevelUp(newLevel: number, rewards: string) {
    this.show({
      type: 'level',
      title: `⭐ Nível ${newLevel} Alcançado!`,
      message: `Recompensas: ${rewards}`,
      icon: 'fa-star',
      duration: 5000,
      action: {
        label: 'Ver Perfil',
        handler: () => {
          // Navigate to profile
          window.dispatchEvent(new CustomEvent('navigate-to-profile'));
        }
      }
    });
  }
  
  showTokensEarned(amount: number, reason: string) {
    this.show({
      type: 'reward',
      title: `+${amount} Tokens`,
      message: reason,
      icon: 'fa-coins',
      duration: 3000
    });
  }
  
  showChallengeComplete(challengeName: string, reward: number) {
    this.show({
      type: 'challenge',
      title: '✅ Desafio Completo!',
      message: `${challengeName} - Ganhou ${reward} tokens!`,
      icon: 'fa-check-circle',
      duration: 4000
    });
  }
}

export const notificationService = new NotificationService();
```