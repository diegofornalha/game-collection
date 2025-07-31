# Guia de Integração - Sistema de Navegação

## Pontos de Integração com Código Existente

### 1. Modificações no StatusBar.vue

**Situação Atual:**
- StatusBar contém controles do jogo (Dica, Desfazer, Som, etc)
- Posicionado no topo da tela

**Mudanças Necessárias:**
```vue
<!-- StatusBar.vue - DEPOIS -->
<template>
  <div class="status-bar game-controls">
    <!-- Manter apenas controles específicos do jogo -->
    <div class="game-actions">
      <button @click="onHintClick" class="hint-btn">
        <i class="fa fa-lightbulb"></i> Dica
      </button>
      <button @click="onUndoClick" :disabled="!canUndo">
        <i class="fa fa-undo"></i>
      </button>
      <button @click="onRedoClick" :disabled="!canRedo">
        <i class="fa fa-redo"></i>
      </button>
    </div>
  </div>
</template>
```

### 2. Modificações no UserProfileHeader.vue

**Situação Atual:**
- Contém RouterLink (incompatível)
- Menu hamburger que precisa ser removido

**Mudanças Necessárias:**
```vue
<!-- UserProfileHeader.vue - DEPOIS -->
<template>
  <header class="user-header">
    <div class="user-info">
      <UserLevelDisplay ... />
      <TokenDisplay ... />
    </div>
    
    <!-- Remover menu hamburger e RouterLinks -->
    <!-- Menu agora é gerenciado pelo NavigationMenu -->
    
    <div v-if="showGameStats" class="game-stats">
      <div class="score">{{ score }}</div>
      <div class="timer">{{ formattedTime }}</div>
    </div>
  </header>
</template>
```

### 3. Modificações no GameView.vue

**Situação Atual:**
- View principal do jogo
- Gerencia modais e estado

**Mudanças Necessárias:**
```vue
<script setup lang="ts">
// Adicionar integração com NavigationStore
import { useNavigationStore } from '@/stores/navigation.store';

const navigationStore = useNavigationStore();

// Lifecycle hooks para preservação de estado
onBeforeUnmount(() => {
  if (gameStore.isPlaying && !gameStore.isPaused) {
    navigationStore.preserveGameState({
      tiles: tileFieldRef.value?.getTiles(),
      score: gameStore.score,
      timer: gameStore.timer,
      // ... outros estados
    });
  }
});

onMounted(() => {
  // Restaurar estado se voltando de outra view
  const preserved = navigationStore.getPreservedGameState();
  if (preserved) {
    gameStore.restoreState(preserved);
    navigationStore.clearPreservedGameState();
  }
});
</script>
```

### 4. Modificações no App.vue

**Situação Atual:**
- Renderiza GameView ou MobileGameView diretamente

**Mudanças Necessárias:**
```vue
<!-- App.vue - DEPOIS -->
<template>
  <div id="app" :class="appClasses">
    <NavigationManager v-if="!isMobile" />
    <MobileNavigationManager v-else />
  </div>
</template>

<script setup lang="ts">
import NavigationManager from '@/components/navigation/NavigationManager.vue';
import MobileNavigationManager from '@/components/navigation/MobileNavigationManager.vue';
</script>
```

### 5. Nova Estrutura de Pastas

```
src/
├── components/
│   ├── navigation/
│   │   ├── NavigationManager.vue
│   │   ├── NavigationMenu.vue
│   │   ├── NavigationItem.vue
│   │   └── ViewContainer.vue
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── ProfileView.vue
│   │   ├── SettingsView.vue
│   │   ├── AchievementsView.vue
│   │   └── StoreView.vue
│   └── ... (componentes existentes)
├── stores/
│   ├── navigation.store.ts (NOVO)
│   └── ... (stores existentes)
└── types/
    ├── navigation.types.ts (NOVO)
    └── ... (types existentes)
```

## Ordem de Implementação Recomendada

### Fase 1: Infraestrutura Base
1. **navigation.store.ts** - Store de navegação
2. **navigation.types.ts** - TypeScript interfaces
3. **ViewContainer.vue** - Container com transições
4. **NavigationManager.vue** - Gerenciador principal

### Fase 2: Menu de Navegação
1. **NavigationMenu.vue** - Componente do menu
2. **NavigationItem.vue** - Items individuais
3. **Estilos SCSS** - Mobile e desktop

### Fase 3: Views Básicas
1. **HomeView.vue** - Tela inicial (prioritária)
2. **SettingsView.vue** - Migrar configurações existentes
3. **ProfileView.vue** - Perfil do usuário

### Fase 4: Views Secundárias
1. **AchievementsView.vue** - Sistema de conquistas
2. **StoreView.vue** - Loja de tokens

### Fase 5: Integração Final
1. Remover RouterLinks do UserProfileHeader
2. Atualizar StatusBar para versão simplificada
3. Integrar preservação de estado no GameView
4. Testes de integração completos

## Preservação de Estado - Detalhes Técnicos

### GameStore Modifications
```typescript
// game.store.ts - Adicionar métodos
export const useGameStore = defineStore('game', () => {
  // ... existing code ...
  
  // Novo: Criar snapshot do estado
  function createSnapshot(): GameSnapshot {
    return {
      tiles: tiles.value.map(t => ({
        x: t.x,
        y: t.y,
        z: t.z,
        typeGroup: t.typeGroup,
        typeIndex: t.typeIndex,
        active: t.active,
        selected: t.selected
      })),
      score: score.value,
      timer: timer.value,
      moves: [...moves.value],
      undoStack: [...undoStack.value],
      selectedTile: selectedTile.value ? { ...selectedTile.value } : null,
      isPaused: isPaused.value,
      hintsUsed: hintsUsed.value,
      currentCombo: currentCombo.value
    };
  }
  
  // Novo: Restaurar de snapshot
  function restoreSnapshot(snapshot: GameSnapshot): void {
    // Pausar timer primeiro
    stopTimer();
    
    // Restaurar estado
    tiles.value = snapshot.tiles;
    score.value = snapshot.score;
    timer.value = snapshot.timer;
    moves.value = snapshot.moves;
    undoStack.value = snapshot.undoStack;
    selectedTile.value = snapshot.selectedTile;
    isPaused.value = snapshot.isPaused;
    hintsUsed.value = snapshot.hintsUsed;
    currentCombo.value = snapshot.currentCombo;
    
    // Retomar se não estava pausado
    if (!snapshot.isPaused) {
      startTimer();
    }
  }
  
  return {
    // ... existing exports ...
    createSnapshot,
    restoreSnapshot
  };
});
```

## Tratamento de Edge Cases

### 1. Navegação Durante Animações
```typescript
// Aguardar animações antes de navegar
async function safeNavigate(target: ViewType) {
  if (animationInProgress.value) {
    await waitForAnimation();
  }
  navigationStore.navigateTo(target);
}
```

### 2. Preservação com Modais Abertos
```typescript
// Fechar modais antes de navegar
function handleNavigation(target: ViewType) {
  // Fechar todos os modais
  showWinModal.value = false;
  showTieModal.value = false;
  showRestartDialog.value = false;
  
  // Então navegar
  navigationStore.navigateTo(target);
}
```

### 3. Navegação com Jogo Completo
```typescript
// Limpar estado ao navegar após vitória
if (isGameComplete.value) {
  navigationStore.clearPreservedGameState();
}
```

## Testes Necessários

### Testes Unitários
- NavigationStore: navegação, histórico, preservação
- ViewContainer: transições, lazy loading
- NavigationMenu: seleção, badges, responsividade

### Testes de Integração
- Preservação completa do estado do jogo
- Navegação durante diferentes estados do jogo
- Sincronização de UI entre views
- Performance com múltiplas navegações

### Testes E2E
- Fluxo completo: jogar → navegar → voltar → continuar
- Navegação em dispositivos móveis vs desktop
- Gestos de swipe em mobile
- Atalhos de teclado em desktop

## Considerações de Performance

### 1. Lazy Loading de Views
```typescript
const HomeView = defineAsyncComponent(() => 
  import('@/components/views/HomeView.vue')
);
```

### 2. Cache de Views Visitadas
```typescript
// keep-alive para views frequentes
<KeepAlive :include="['GameView', 'HomeView']">
  <component :is="currentView" />
</KeepAlive>
```

### 3. Otimização de Transições
```scss
// Usar transform ao invés de position
.slide-enter-active {
  transform: translateX(0);
  will-change: transform;
}
```

## Migração de Dados

### Configurações Existentes
- Manter compatibilidade com preferencesService
- Migrar dados do localStorage se necessário
- Preservar todas as preferências do usuário

### Estado do Jogo
- Detectar jogos salvos existentes
- Converter para novo formato se necessário
- Manter backup durante migração