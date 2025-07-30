# Fluxo de Integração - Sistema de Ofensiva Diária

## 🔄 Fluxo Completo de Interação

```mermaid
graph TD
    subgraph "Inicialização"
        START[App.vue mounted] --> LOAD_PROFILE[Load User Profile]
        LOAD_PROFILE --> CHECK_STREAK[Check Daily Streak]
        CHECK_STREAK --> LOAD_CHALLENGES[Load Challenges]
        LOAD_CHALLENGES --> RENDER_UI[Render UI]
    end
    
    subgraph "Interface de Usuário"
        RENDER_UI --> HEADER[UserProfileHeader]
        HEADER --> STREAK_IND[DailyStreakIndicator]
        HEADER --> TOKEN_DISP[TokenDisplay]
        HEADER --> USER_MENU[UserMenu]
        
        STREAK_IND --> TOOLTIP[Streak Tooltip]
        TOOLTIP --> CHALLENGE_INFO[Today's Challenge]
    end
    
    subgraph "Gameplay"
        GAME_START[Start Game] --> DAILY_LOGIN[Daily Login Check]
        DAILY_LOGIN --> LOGIN_BONUS[Award Login Bonus]
        
        GAME_PLAY[Playing Game] --> MOVE[Make Move]
        MOVE --> CONTEXT_UPDATE[Update Game Context]
        CONTEXT_UPDATE --> CHECK_RULES[Check Challenge Rules]
        
        GAME_END[Game Complete] --> CALC_REWARDS[Calculate Rewards]
        CALC_REWARDS --> STREAK_MULT[Apply Streak Multiplier]
        STREAK_MULT --> AWARD_TOKENS[Award Tokens]
        AWARD_TOKENS --> AWARD_XP[Award XP]
        AWARD_XP --> CHECK_LEVEL[Check Level Up]
        CHECK_LEVEL --> CHECK_ACHIEVE[Check Achievements]
    end
    
    subgraph "Sistema de Recompensas"
        AWARD_TOKENS --> UPDATE_PROFILE[Update Profile]
        AWARD_XP --> UPDATE_PROFILE
        CHECK_LEVEL --> LEVEL_UP{Level Up?}
        LEVEL_UP -->|Yes| LEVEL_REWARDS[Award Level Rewards]
        LEVEL_UP -->|No| CONTINUE[Continue]
        
        CHECK_ACHIEVE --> ACHIEVE_UNLOCK{New Achievement?}
        ACHIEVE_UNLOCK -->|Yes| ACHIEVE_REWARDS[Award Achievement]
        ACHIEVE_UNLOCK -->|No| CONTINUE
    end
    
    subgraph "Notificações"
        LOGIN_BONUS --> NOTIFY[Show Notification]
        LEVEL_REWARDS --> NOTIFY
        ACHIEVE_REWARDS --> NOTIFY
        CHALLENGE_INFO --> NOTIFY
    end
    
    subgraph "Persistência"
        UPDATE_PROFILE --> SAVE_LOCAL[Save to LocalStorage]
        SAVE_LOCAL --> UPDATE_UI[Update UI Components]
        UPDATE_UI --> STREAK_IND
        UPDATE_UI --> TOKEN_DISP
    end
```

## 📱 Mobile vs Desktop Flow

```mermaid
graph LR
    subgraph "Desktop Experience"
        D_HEADER[Full Header] --> D_PROFILE[Profile Section]
        D_HEADER --> D_STREAK[Streak with Tooltip]
        D_HEADER --> D_STATS[Full Stats Display]
        
        D_STREAK --> D_HOVER[Hover Effects]
        D_HOVER --> D_DETAILS[Detailed Info]
    end
    
    subgraph "Mobile Experience"
        M_HEADER[Compact Header] --> M_ROW[Single Row]
        M_ROW --> M_AVATAR[Small Avatar]
        M_ROW --> M_STREAK[Compact Streak]
        M_ROW --> M_TOKENS[Compact Tokens]
        
        M_STREAK --> M_TAP[Tap for Modal]
        M_TAP --> M_MODAL[Full Screen Modal]
    end
    
    RESPONSIVE{Responsive Check} -->|Desktop| D_HEADER
    RESPONSIVE -->|Mobile| M_HEADER
```

## 🎮 Game Session Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant Game as GameView
    participant Streak as DailyStreakStore
    participant Profile as UserProfileStore
    participant Challenge as ChallengesStore
    participant Storage as StorageService
    
    User->>Game: Start Session
    Game->>Streak: checkDailyLogin()
    
    alt First Login Today
        Streak->>Profile: addTokens(dailyBonus)
        Streak->>Profile: addXP(25)
        Streak->>Storage: saveStreakData()
        Streak-->>User: Show Login Bonus
    end
    
    Game->>Challenge: getTodayChallenge()
    Challenge-->>Game: Challenge Details
    Game-->>User: Display Challenge
    
    User->>Game: Play Game
    
    loop Each Move
        Game->>Game: Update Context
        Game->>Challenge: Check Progress
    end
    
    User->>Game: Complete Game
    Game->>Streak: completeGame(score, time)
    Streak->>Challenge: checkChallengeCompletion()
    
    alt Challenge Completed
        Challenge->>Profile: addTokens(reward)
        Challenge->>Profile: addXP(50)
        Challenge-->>User: Challenge Complete!
    end
    
    Streak->>Profile: addTokens(gameReward * multiplier)
    Streak->>Profile: addXP(baseXP * multiplier)
    
    Profile->>Profile: Check Level Up
    alt Level Up
        Profile->>Profile: level++
        Profile->>Profile: addTokens(levelBonus)
        Profile-->>User: Level Up Animation
    end
    
    Profile->>Storage: saveProfile()
    Streak->>Storage: saveStreakData()
    Challenge->>Storage: saveChallenges()
```

## 🔌 Component Communication

```mermaid
graph TB
    subgraph "Event System"
        E1[game-complete]
        E2[tokens-earned]
        E3[level-up]
        E4[achievement-unlocked]
        E5[challenge-completed]
        E6[streak-broken]
    end
    
    subgraph "Components"
        GAME[GameView]
        HEADER[UserProfileHeader]
        STREAK[DailyStreakIndicator]
        TOKEN[TokenDisplay]
        NOTIF[NotificationCenter]
    end
    
    GAME --> E1
    E1 --> STREAK
    E1 --> TOKEN
    
    E2 --> TOKEN
    E2 --> NOTIF
    
    E3 --> HEADER
    E3 --> NOTIF
    
    E4 --> NOTIF
    E5 --> NOTIF
    E6 --> STREAK
    E6 --> NOTIF
```

## 🏗️ Store Dependencies

```mermaid
graph LR
    subgraph "Stores"
        GAME_STORE[gameStore]
        PROFILE_STORE[userProfileStore]
        STREAK_STORE[dailyStreakStore]
        CHALLENGE_STORE[challengesStore]
    end
    
    subgraph "Dependencies"
        STREAK_STORE --> PROFILE_STORE
        STREAK_STORE --> CHALLENGE_STORE
        CHALLENGE_STORE --> RULES_ENGINE[RulesEngine]
        PROFILE_STORE --> STORAGE[StorageService]
        STREAK_STORE --> STORAGE
        CHALLENGE_STORE --> STORAGE
    end
    
    subgraph "Composables"
        USE_STREAK[useDailyStreak]
        USE_TOKEN[useTokenSystem]
        USE_LEVEL[useUserLevel]
    end
    
    USE_STREAK --> STREAK_STORE
    USE_STREAK --> CHALLENGE_STORE
    USE_TOKEN --> PROFILE_STORE
    USE_LEVEL --> PROFILE_STORE
```

## 📊 Data Flow Examples

### 1. Daily Login Flow
```typescript
// User opens app
App.mounted() {
  await userProfileStore.loadProfile();
  await dailyStreakStore.checkDailyLogin();
  // If new day:
  // - Increment streak
  // - Award login bonus
  // - Generate daily challenge
  // - Show notifications
}
```

### 2. Game Completion Flow
```typescript
// Game ends
gameStore.isGameComplete = true;

// Emit event
window.dispatchEvent(new CustomEvent('game-complete', {
  detail: { score: 450, time: 240 }
}));

// useDailyStreak composable handles it
async handleGameComplete(event) {
  const { score, time } = event.detail;
  
  // 1. Complete daily streak
  await streakStore.completeGame(score, time);
  
  // 2. Check challenges
  const challenge = await challengesStore.getTodayChallenge();
  if (challenge && rulesEngine.evaluate(challenge.rules, context)) {
    // Award challenge rewards
  }
  
  // 3. Calculate total rewards
  const tokens = baseTokens * streakMultiplier;
  const xp = baseXP * streakMultiplier;
  
  // 4. Update profile
  userProfileStore.addTokens(tokens, 'Game Complete');
  userProfileStore.addXP(xp, 'Game Complete');
}
```

### 3. Challenge Validation Flow
```typescript
// During gameplay
gameStore.on('move', (move) => {
  // Update context
  gameContextService.recordMove(move.tile1, move.tile2);
  
  // Get current context
  const context = gameContextService.getCurrentContext();
  
  // Check active challenges
  const activeChallenges = challengesStore.activeChallenges;
  
  activeChallenges.forEach(challenge => {
    const progress = rulesEngine.evaluateProgress(challenge.rules, context);
    
    // Update UI with progress
    if (progress.changed) {
      updateChallengeProgress(challenge.id, progress);
    }
  });
});
```

## 🎨 UI State Management

### Component State Hierarchy
```
App.vue
├── UserProfileHeader.vue
│   ├── state: { showMenu: false }
│   ├── DailyStreakIndicator.vue
│   │   └── state: { showTooltip: false }
│   ├── TokenDisplay.vue
│   │   └── state: { animating: false }
│   └── UserMenu.vue
│       └── state: { activeTab: 'profile' }
├── GameView.vue
│   ├── computed: from gameStore
│   └── ChallengeModal.vue
│       └── props: { challenge }
└── NotificationCenter.vue
    └── state: { notifications: [] }
```

### Reactive Data Flow
```typescript
// Profile changes trigger UI updates
userProfileStore.$subscribe((mutation, state) => {
  // TokenDisplay auto-updates via computed
  // Level changes trigger animations
  // Achievement unlocks show notifications
});

// Streak changes update indicator
dailyStreakStore.$subscribe((mutation, state) => {
  // Flame animation changes
  // Multiplier updates
  // Milestone notifications
});
```

## 🔐 Security Considerations

1. **Client-side Validation**: All rewards are calculated client-side (for now)
2. **Future Server Sync**: Prepared for server validation
3. **Anti-cheat**: Basic timestamp validation
4. **Data Integrity**: Checksums for critical data

## 🚀 Performance Optimizations

1. **Lazy Loading**: Challenge rules loaded on demand
2. **Debounced Saves**: Storage writes are batched
3. **Computed Caching**: Heavy calculations are memoized
4. **Event Throttling**: Notifications are queued
5. **Component Splitting**: Mobile/Desktop components loaded conditionally

## 📱 Progressive Enhancement

```typescript
// Base functionality works without daily streak
if (featureFlags.dailyStreak) {
  // Enhanced experience with streak system
  loadDailyStreakModule();
} else {
  // Basic game experience
  loadBasicGame();
}
```