# Composables do Sistema de Ofensiva Diária

## 🎯 useDailyStreak()

```typescript
// composables/useDailyStreak.ts
import { computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useDailyStreakStore } from '@/stores/dailyStreak.store';
import { useChallengesStore } from '@/stores/challenges.store';

export function useDailyStreak() {
  const streakStore = useDailyStreakStore();
  const challengesStore = useChallengesStore();
  
  // Reactive references
  const { 
    currentStreak, 
    longestStreak, 
    todayPlayed,
    isStreakActive,
    hoursUntilReset 
  } = storeToRefs(streakStore);
  
  const { todayChallenge } = storeToRefs(challengesStore);
  
  // Computed properties
  const streakStatus = computed(() => {
    if (currentStreak.value === 0) return 'inactive';
    if (currentStreak.value < 7) return 'building';
    if (currentStreak.value < 30) return 'strong';
    if (currentStreak.value < 100) return 'epic';
    return 'legendary';
  });
  
  const nextMilestone = computed(() => {
    const milestones = [3, 7, 14, 30, 60, 100, 365];
    return milestones.find(m => m > currentStreak.value) || null;
  });
  
  const daysUntilNextMilestone = computed(() => {
    if (!nextMilestone.value) return null;
    return nextMilestone.value - currentStreak.value;
  });
  
  const streakMultiplier = computed(() => {
    return Math.min(1 + (currentStreak.value * 0.1), 3);
  });
  
  // Methods
  async function checkIn() {
    await streakStore.checkDailyLogin();
  }
  
  async function completeGame(score: number, time: number) {
    await streakStore.completeGame(score, time);
  }
  
  // Auto check-in on mount
  onMounted(() => {
    checkIn();
  });
  
  // Listen for game completion events
  const handleGameComplete = (event: CustomEvent) => {
    const { score, time } = event.detail;
    completeGame(score, time);
  };
  
  onMounted(() => {
    window.addEventListener('game-complete', handleGameComplete as EventListener);
  });
  
  onUnmounted(() => {
    window.removeEventListener('game-complete', handleGameComplete as EventListener);
  });
  
  return {
    // State
    currentStreak,
    longestStreak,
    todayPlayed,
    isStreakActive,
    hoursUntilReset,
    todayChallenge,
    
    // Computed
    streakStatus,
    nextMilestone,
    daysUntilNextMilestone,
    streakMultiplier,
    
    // Methods
    checkIn,
    completeGame
  };
}
```

## 💰 useTokenSystem()

```typescript
// composables/useTokenSystem.ts
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserProfileStore } from '@/stores/userProfile.store';

export interface TokenTransaction {
  amount: number;
  reason: string;
  timestamp: Date;
  type: 'earned' | 'spent';
}

export function useTokenSystem() {
  const userProfileStore = useUserProfileStore();
  const { tokens } = storeToRefs(userProfileStore);
  
  // Local state for animations
  const pendingAnimation = ref<number>(0);
  const recentTransactions = ref<TokenTransaction[]>([]);
  
  // Computed properties
  const formattedTokens = computed(() => {
    return tokens.value.toLocaleString('pt-BR');
  });
  
  const canAfford = (amount: number) => computed(() => {
    return tokens.value >= amount;
  });
  
  // Token categories for shop
  const tokenPackages = computed(() => [
    { 
      id: 'starter',
      name: 'Pacote Inicial',
      tokens: 100,
      price: 0,
      bonus: 0,
      available: tokens.value === 0
    },
    {
      id: 'booster',
      name: 'Impulsionador',
      tokens: 500,
      price: 4.99,
      bonus: 50,
      popular: true
    },
    {
      id: 'mega',
      name: 'Mega Pacote',
      tokens: 1200,
      price: 9.99,
      bonus: 200,
      bestValue: true
    },
    {
      id: 'ultimate',
      name: 'Pacote Supremo',
      tokens: 3000,
      price: 19.99,
      bonus: 750,
      premium: true
    }
  ]);
  
  // Methods
  function earnTokens(amount: number, reason: string) {
    userProfileStore.addTokens(amount, reason);
    
    // Add to recent transactions
    recentTransactions.value.unshift({
      amount,
      reason,
      timestamp: new Date(),
      type: 'earned'
    });
    
    // Keep only last 10 transactions
    if (recentTransactions.value.length > 10) {
      recentTransactions.value.pop();
    }
    
    // Trigger animation
    pendingAnimation.value = amount;
    setTimeout(() => {
      pendingAnimation.value = 0;
    }, 2000);
  }
  
  function spendTokens(amount: number, reason: string): boolean {
    const success = userProfileStore.spendTokens(amount);
    
    if (success) {
      recentTransactions.value.unshift({
        amount,
        reason,
        timestamp: new Date(),
        type: 'spent'
      });
      
      if (recentTransactions.value.length > 10) {
        recentTransactions.value.pop();
      }
    }
    
    return success;
  }
  
  // Token shop items
  const shopItems = computed(() => [
    {
      id: 'hint-pack-5',
      name: '5 Dicas',
      description: 'Pacote com 5 dicas para usar durante o jogo',
      price: 50,
      category: 'powerups',
      icon: 'fa-star'
    },
    {
      id: 'hint-pack-20',
      name: '20 Dicas',
      description: 'Pacote econômico com 20 dicas',
      price: 150,
      category: 'powerups',
      icon: 'fa-star',
      discount: 25
    },
    {
      id: 'undo-pack-10',
      name: '10 Desfazer',
      description: 'Desfaça jogadas sem limites',
      price: 75,
      category: 'powerups',
      icon: 'fa-undo'
    },
    {
      id: 'time-freeze',
      name: 'Congelar Tempo',
      description: 'Congele o cronômetro por 3 partidas',
      price: 100,
      category: 'powerups',
      icon: 'fa-clock-o'
    },
    {
      id: 'xp-boost-1h',
      name: 'XP Boost (1h)',
      description: 'Dobre seus ganhos de XP por 1 hora',
      price: 200,
      category: 'boosters',
      icon: 'fa-rocket'
    },
    {
      id: 'token-magnet-24h',
      name: 'Ímã de Tokens (24h)',
      description: '+50% tokens em todas as partidas por 24 horas',
      price: 500,
      category: 'boosters',
      icon: 'fa-magnet'
    },
    {
      id: 'avatar-frame-fire',
      name: 'Moldura de Fogo',
      description: 'Moldura animada de fogo para seu avatar',
      price: 300,
      category: 'cosmetics',
      icon: 'fa-fire'
    },
    {
      id: 'tile-skin-golden',
      name: 'Peças Douradas',
      description: 'Skin dourada para as peças do jogo',
      price: 750,
      category: 'cosmetics',
      icon: 'fa-gem',
      premium: true
    }
  ]);
  
  // Watch for external token events
  watch(tokens, (newValue, oldValue) => {
    if (newValue > oldValue) {
      const difference = newValue - oldValue;
      // Token earned animation/sound could be triggered here
    }
  });
  
  return {
    // State
    tokens,
    pendingAnimation,
    recentTransactions,
    
    // Computed
    formattedTokens,
    canAfford,
    tokenPackages,
    shopItems,
    
    // Methods
    earnTokens,
    spendTokens
  };
}
```

## 📊 useUserLevel()

```typescript
// composables/useUserLevel.ts
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserProfileStore } from '@/stores/userProfile.store';

export interface LevelReward {
  level: number;
  tokens: number;
  unlocks: string[];
  title?: string;
}

export function useUserLevel() {
  const userProfileStore = useUserProfileStore();
  const { level, currentXP, totalXP } = storeToRefs(userProfileStore);
  
  // Level calculations
  const nextLevelXP = computed(() => {
    return userProfileStore.getNextLevelXP();
  });
  
  const progressToNextLevel = computed(() => {
    return (currentXP.value / nextLevelXP.value) * 100;
  });
  
  const xpUntilNextLevel = computed(() => {
    return nextLevelXP.value - currentXP.value;
  });
  
  // Level titles
  const levelTitle = computed(() => {
    const titles = [
      { min: 1, max: 5, title: 'Iniciante' },
      { min: 6, max: 10, title: 'Aprendiz' },
      { min: 11, max: 20, title: 'Jogador' },
      { min: 21, max: 30, title: 'Habilidoso' },
      { min: 31, max: 40, title: 'Experiente' },
      { min: 41, max: 50, title: 'Veterano' },
      { min: 51, max: 60, title: 'Especialista' },
      { min: 61, max: 70, title: 'Mestre' },
      { min: 71, max: 80, title: 'Grão-Mestre' },
      { min: 81, max: 90, title: 'Campeão' },
      { min: 91, max: 99, title: 'Lenda' },
      { min: 100, max: 999, title: 'Mítico' }
    ];
    
    const current = titles.find(t => level.value >= t.min && level.value <= t.max);
    return current?.title || 'Jogador';
  });
  
  // Level color/theme
  const levelColor = computed(() => {
    if (level.value < 10) return '#9CA3AF'; // Gray
    if (level.value < 25) return '#10B981'; // Green
    if (level.value < 50) return '#3B82F6'; // Blue
    if (level.value < 75) return '#8B5CF6'; // Purple
    if (level.value < 100) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  });
  
  // Level rewards
  const levelRewards = computed((): LevelReward[] => [
    {
      level: 5,
      tokens: 100,
      unlocks: ['avatar_frame_bronze'],
      title: 'Moldura Bronze desbloqueada!'
    },
    {
      level: 10,
      tokens: 250,
      unlocks: ['tile_skin_wood', 'challenge_slot_2'],
      title: 'Skin de Madeira desbloqueada!'
    },
    {
      level: 20,
      tokens: 500,
      unlocks: ['avatar_frame_silver', 'xp_boost_permanent_10'],
      title: 'Boost de XP permanente +10%!'
    },
    {
      level: 30,
      tokens: 750,
      unlocks: ['tile_skin_jade', 'hint_discount_25'],
      title: 'Desconto de 25% em dicas!'
    },
    {
      level: 50,
      tokens: 1500,
      unlocks: ['avatar_frame_gold', 'tile_skin_crystal', 'challenge_slot_3'],
      title: 'Moldura Dourada desbloqueada!'
    },
    {
      level: 75,
      tokens: 3000,
      unlocks: ['avatar_frame_platinum', 'token_multiplier_1.5x'],
      title: 'Multiplicador de tokens 1.5x!'
    },
    {
      level: 100,
      tokens: 5000,
      unlocks: ['avatar_frame_legendary', 'tile_skin_legendary', 'vip_status'],
      title: 'Status VIP Lendário alcançado!'
    }
  ]);
  
  const unlockedRewards = computed(() => {
    return levelRewards.value.filter(r => level.value >= r.level);
  });
  
  const nextReward = computed(() => {
    return levelRewards.value.find(r => r.level > level.value);
  });
  
  // XP sources and multipliers
  const xpSources = computed(() => ({
    gameComplete: 25,
    perfectGame: 100,
    dailyChallenge: 50,
    weeklyChallenge: 200,
    firstGameOfDay: 25,
    streakBonus: currentXP.value * 0.1,
    speedBonus: 50, // Complete under 3 minutes
    noHintBonus: 30,
    comboBonus: 10 // Per combo
  }));
  
  // Methods
  function addXP(amount: number, source: string) {
    userProfileStore.addXP(amount, source);
  }
  
  function calculateXPForAction(action: string, context?: any): number {
    const baseXP = xpSources.value[action as keyof typeof xpSources.value] || 0;
    
    // Apply multipliers
    let multiplier = 1;
    
    // VIP multiplier
    if (unlockedRewards.value.some(r => r.unlocks.includes('vip_status'))) {
      multiplier *= 1.5;
    }
    
    // XP boost items
    if (context?.hasXPBoost) {
      multiplier *= 2;
    }
    
    // Permanent boost from level rewards
    if (level.value >= 20) {
      multiplier *= 1.1;
    }
    
    return Math.floor(baseXP * multiplier);
  }
  
  return {
    // State
    level,
    currentXP,
    totalXP,
    
    // Computed
    nextLevelXP,
    progressToNextLevel,
    xpUntilNextLevel,
    levelTitle,
    levelColor,
    levelRewards,
    unlockedRewards,
    nextReward,
    xpSources,
    
    // Methods
    addXP,
    calculateXPForAction
  };
}
```

## 📏 useChallengeRules()

```typescript
// composables/useChallengeRules.ts
import { ref, computed } from 'vue';
import { RulesEngine } from '@/services/rules.engine';
import type { IChallengeRule, ChallengeContext } from '@/types/challenges.types';

export function useChallengeRules() {
  const rulesEngine = new RulesEngine();
  const customRules = ref<Map<string, IChallengeRule>>(new Map());
  
  // Register custom game-specific rules
  function registerGameRules() {
    // Specific tile pattern rule
    rulesEngine.registerRule('tile-pattern', (config) => ({
      type: 'tile-pattern',
      evaluate: (context) => {
        const { pattern } = config;
        return context.tilesMatched?.includes(pattern) || false;
      },
      getDescription: () => `Combine peças de ${config.pattern}`
    }));
    
    // Layout completion rule
    rulesEngine.registerRule('layout-complete', (config) => ({
      type: 'layout-complete',
      evaluate: (context) => {
        return context.layoutName === config.layoutName && context.completed;
      },
      getDescription: () => `Complete o layout ${config.layoutName}`
    }));
    
    // Perfect game rule (no hints, no undo)
    rulesEngine.registerRule('perfect-game', () => ({
      type: 'perfect-game',
      evaluate: (context) => {
        return context.hintsUsed === 0 && 
               context.undoCount === 0 && 
               context.completed;
      },
      getDescription: () => 'Complete uma partida perfeita'
    }));
    
    // Speed run rule
    rulesEngine.registerRule('speed-run', (config) => ({
      type: 'speed-run',
      evaluate: (context) => {
        return context.completed && 
               context.timeInSeconds <= config.maxTime;
      },
      getDescription: () => `Complete em menos de ${config.maxTime / 60} minutos`
    }));
    
    // Chain combo rule
    rulesEngine.registerRule('chain-combo', (config) => ({
      type: 'chain-combo',
      evaluate: (context) => {
        const timeBetweenMoves = context.moveTimestamps || [];
        let maxChain = 0;
        let currentChain = 1;
        
        for (let i = 1; i < timeBetweenMoves.length; i++) {
          const timeDiff = timeBetweenMoves[i] - timeBetweenMoves[i-1];
          if (timeDiff <= config.maxTimeBetween * 1000) {
            currentChain++;
            maxChain = Math.max(maxChain, currentChain);
          } else {
            currentChain = 1;
          }
        }
        
        return maxChain >= config.minChain;
      },
      getDescription: () => `Faça ${config.minChain} jogadas em sequência rápida`
    }));
    
    // Specific score range rule
    rulesEngine.registerRule('score-range', (config) => ({
      type: 'score-range',
      evaluate: (context) => {
        return context.score >= config.minScore && 
               context.score <= config.maxScore;
      },
      getDescription: () => `Termine com pontuação entre ${config.minScore} e ${config.maxScore}`
    }));
  }
  
  // Initialize custom rules
  registerGameRules();
  
  // Rule templates for different challenge types
  const challengeTemplates = computed(() => ({
    daily: [
      {
        name: 'Desafio Rápido',
        rules: [
          rulesEngine.createRule('time-limit', { maxTime: 180 }),
          rulesEngine.createRule('minimum-score', { minScore: 300 })
        ]
      },
      {
        name: 'Mestre Zen',
        rules: [
          rulesEngine.createRule('no-hints', {}),
          rulesEngine.createRule('no-undo', {}),
          rulesEngine.createRule('minimum-score', { minScore: 400 })
        ]
      },
      {
        name: 'Combo Master',
        rules: [
          rulesEngine.createRule('chain-combo', { 
            minChain: 5, 
            maxTimeBetween: 3 
          })
        ]
      }
    ],
    weekly: [
      {
        name: 'Maratonista',
        rules: [
          rulesEngine.createRule('games-played', { minGames: 20 }),
          rulesEngine.createRule('minimum-score', { minScore: 10000 })
        ]
      },
      {
        name: 'Perfeccionista Semanal',
        rules: [
          rulesEngine.createRule('perfect-game', {}),
          rulesEngine.createRule('games-played', { minGames: 5 })
        ]
      }
    ],
    special: [
      {
        name: 'Evento de Temporada',
        rules: [
          rulesEngine.createRule('tile-pattern', { pattern: 'season' }),
          rulesEngine.createRule('minimum-score', { minScore: 500 })
        ]
      },
      {
        name: 'Desafio Épico',
        rules: [
          rulesEngine.createRule('layout-complete', { layoutName: 'dragon' }),
          rulesEngine.createRule('perfect-game', {}),
          rulesEngine.createRule('time-limit', { maxTime: 600 })
        ]
      }
    ]
  }));
  
  // Create challenge from template
  function createChallengeFromTemplate(
    type: 'daily' | 'weekly' | 'special', 
    templateIndex: number
  ) {
    const templates = challengeTemplates.value[type];
    if (templateIndex >= 0 && templateIndex < templates.length) {
      return templates[templateIndex];
    }
    return null;
  }
  
  // Evaluate multiple rules
  function evaluateChallenge(
    rules: IChallengeRule[], 
    context: ChallengeContext
  ): {
    passed: boolean;
    results: Array<{ rule: IChallengeRule; passed: boolean }>;
  } {
    const results = rules.map(rule => ({
      rule,
      passed: rulesEngine.evaluateRule(rule, context)
    }));
    
    const passed = results.every(r => r.passed);
    
    return { passed, results };
  }
  
  // Get rule description
  function getRuleDescriptions(rules: IChallengeRule[]): string[] {
    return rules.map(rule => rule.getDescription());
  }
  
  return {
    // Core
    rulesEngine,
    customRules,
    
    // Templates
    challengeTemplates,
    
    // Methods
    createChallengeFromTemplate,
    evaluateChallenge,
    getRuleDescriptions
  };
}
```

## 🔌 useResponsive()

```typescript
// composables/useResponsive.ts
import { ref, computed, onMounted, onUnmounted } from 'vue';

export function useResponsive() {
  const windowWidth = ref(window.innerWidth);
  const windowHeight = ref(window.innerHeight);
  
  // Breakpoints
  const breakpoints = {
    mobile: 576,
    tablet: 768,
    desktop: 1024,
    wide: 1280
  };
  
  // Computed properties
  const isMobile = computed(() => windowWidth.value < breakpoints.mobile);
  const isTablet = computed(() => 
    windowWidth.value >= breakpoints.mobile && 
    windowWidth.value < breakpoints.tablet
  );
  const isDesktop = computed(() => windowWidth.value >= breakpoints.desktop);
  const isWide = computed(() => windowWidth.value >= breakpoints.wide);
  
  const currentBreakpoint = computed(() => {
    if (isMobile.value) return 'mobile';
    if (isTablet.value) return 'tablet';
    if (isWide.value) return 'wide';
    return 'desktop';
  });
  
  const isPortrait = computed(() => windowHeight.value > windowWidth.value);
  const isLandscape = computed(() => windowWidth.value > windowHeight.value);
  
  // Touch detection
  const hasTouch = computed(() => 'ontouchstart' in window);
  
  // Safe area insets for mobile
  const safeAreaInsets = computed(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--sat') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0')
    };
  });
  
  // Update dimensions
  function updateDimensions() {
    windowWidth.value = window.innerWidth;
    windowHeight.value = window.innerHeight;
  }
  
  // Lifecycle
  onMounted(() => {
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
  });
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateDimensions);
  });
  
  return {
    // Dimensions
    windowWidth,
    windowHeight,
    
    // Breakpoints
    breakpoints,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    currentBreakpoint,
    
    // Orientation
    isPortrait,
    isLandscape,
    
    // Features
    hasTouch,
    safeAreaInsets
  };
}
```

## 🎮 Integration Example

```typescript
// Example: Using composables in GameView.vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useGameStore } from '@/stores/game.store';
import { useDailyStreak } from '@/composables/useDailyStreak';
import { useTokenSystem } from '@/composables/useTokenSystem';
import { useUserLevel } from '@/composables/useUserLevel';

const gameStore = useGameStore();
const { completeGame, todayChallenge } = useDailyStreak();
const { earnTokens } = useTokenSystem();
const { addXP, calculateXPForAction } = useUserLevel();

// When game completes
async function handleGameComplete() {
  const score = gameStore.score;
  const time = gameStore.timer;
  
  // Complete daily streak
  await completeGame(score, time);
  
  // Calculate and award XP
  let totalXP = calculateXPForAction('gameComplete');
  
  if (score > 500) {
    totalXP += calculateXPForAction('perfectGame');
  }
  
  if (time < 180) {
    totalXP += calculateXPForAction('speedBonus');
  }
  
  addXP(totalXP, 'Game Completion');
  
  // Award tokens based on performance
  const baseTokens = 10;
  const timeBonus = Math.max(0, 10 - Math.floor(time / 30));
  const scoreBonus = Math.floor(score / 100);
  
  earnTokens(baseTokens + timeBonus + scoreBonus, 'Partida completa');
}

// Listen for game completion
onMounted(() => {
  gameStore.$subscribe((mutation, state) => {
    if (state.isGameComplete && !state.isPaused) {
      handleGameComplete();
    }
  });
});
</script>
```