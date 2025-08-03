// Storage Types
export interface StorageValue {
  value: unknown;
  timestamp?: number;
  ttl?: number;
}

export interface CacheEntry {
  data: unknown;
  timestamp: number;
}

export interface SavedGameData {
  tiles: Array<{
    x: number;
    y: number;
    z: number;
    typeGroup: string;
    typeIndex: number;
    active: boolean;
    selected: boolean;
  }>;
  score: number;
  timer: number;
  moves: Array<{
    tile1: { x: number; y: number; z: number; typeGroup: string; typeIndex: number };
    tile2: { x: number; y: number; z: number; typeGroup: string; typeIndex: number };
    timestamp: number;
  }>;
  currentLayout: string;
  timestamp: number;
}

export interface PreferencesUpdate {
  soundEnabled?: boolean;
  musicEnabled?: boolean;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  theme?: string;
  autoShuffleEnabled?: boolean;
  autoShuffleDelay?: number;
}

export interface IndexedDBEvent extends Event {
  target: IDBRequest | null;
}

export interface IndexedDBUpgradeEvent extends IDBVersionChangeEvent {
  target: IDBOpenDBRequest | null;
}