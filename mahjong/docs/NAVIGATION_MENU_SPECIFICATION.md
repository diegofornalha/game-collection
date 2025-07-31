# Especificação do Sistema de Menu de Navegação - Mahjong Solitaire

## 1. Visão Geral

### 1.1 Propósito
Implementar um sistema de navegação integrado ao jogo Mahjong Solitaire que permita acesso às diferentes seções do aplicativo sem utilizar roteamento tradicional (Vue Router), mantendo o estado do jogo e proporcionando uma experiência fluida em dispositivos móveis e desktop.

### 1.2 Escopo
- Sistema de navegação baseado em estados/views
- Menu principal com 5 seções: Início, Perfil, Configurações, Conquistas, Loja
- Transições suaves entre telas
- Preservação do estado do jogo
- Design mobile-first responsivo

### 1.3 Definições
- **View State**: Estado que define qual tela está ativa no momento
- **Navigation Manager**: Serviço responsável por controlar as transições entre views
- **View Component**: Componente Vue que representa uma tela/seção específica
- **Game State Preservation**: Capacidade de manter o estado do jogo ao navegar

## 2. Requisitos Funcionais

### 2.1 Sistema de Navegação por Estados

```typescript
interface NavigationState {
  currentView: ViewType;
  previousView: ViewType | null;
  viewHistory: ViewType[];
  gameState: {
    isPaused: boolean;
    wasPlaying: boolean;
    savedPosition: number;
  };
  transitionDirection: 'forward' | 'backward' | 'none';
}

enum ViewType {
  GAME = 'game',
  HOME = 'home', 
  PROFILE = 'profile',
  SETTINGS = 'settings',
  ACHIEVEMENTS = 'achievements',
  STORE = 'store'
}
```

### 2.2 Menu de Navegação

#### 2.2.1 Estrutura do Menu
```yaml
navigation_menu:
  position: "bottom" # mobile: bottom, desktop: integrated in header
  items:
    - id: "home"
      icon: "fas fa-home"
      label: "Início"
      view: "HOME"
      badge: null
      
    - id: "profile"
      icon: "fas fa-user"
      label: "Perfil"
      view: "PROFILE"
      badge: null
      
    - id: "settings"
      icon: "fas fa-cog"
      label: "Config"
      view: "SETTINGS"
      badge: null
      
    - id: "achievements"
      icon: "fas fa-trophy"
      label: "Conquistas"
      view: "ACHIEVEMENTS"
      badge: "new_count" # Mostra número de novas conquistas
      
    - id: "store"
      icon: "fas fa-store"
      label: "Loja"
      view: "STORE"
      badge: "offers_count" # Mostra ofertas especiais
```

### 2.3 Gerenciamento de Estado

#### 2.3.1 Preservação do Estado do Jogo
```typescript
interface GameStatePreservation {
  // Ao sair da view do jogo
  beforeLeaveGame(): {
    tiles: TileState[];
    score: number;
    timer: number;
    moves: Move[];
    undoStack: UndoItem[];
    isPaused: boolean;
  };
  
  // Ao retornar para a view do jogo
  onReturnToGame(savedState: GameState): void;
  
  // Auto-pause quando sair do jogo
  autoPauseOnNavigate: boolean;
}
```

### 2.4 Estrutura de Componentes

```yaml
component_structure:
  App.vue:
    - NavigationManager.vue # Gerencia views e transições
      - ViewContainer.vue # Container com transições
        - GameView.vue # View do jogo (existente)
        - HomeView.vue # Nova tela inicial
        - ProfileView.vue # Perfil do usuário
        - SettingsView.vue # Configurações
        - AchievementsView.vue # Conquistas
        - StoreView.vue # Loja de itens
      - NavigationMenu.vue # Menu de navegação
        - NavigationItem.vue # Item individual do menu
```

## 3. Requisitos Não-Funcionais

### 3.1 Performance
- Transições entre views < 300ms
- Preservação de estado instantânea
- Lazy loading de views não essenciais
- Cache de views visitadas recentemente

### 3.2 UX/UI
- Transições suaves com animações CSS/Vue Transition
- Feedback visual ao selecionar item do menu
- Indicadores de seção ativa
- Suporte a gestos de swipe em mobile

### 3.3 Responsividade
```scss
// Breakpoints
$mobile: 480px;
$tablet: 768px;
$desktop: 1024px;

// Menu positioning
@media (max-width: $tablet) {
  .navigation-menu {
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 60px;
  }
}

@media (min-width: $tablet + 1) {
  .navigation-menu {
    integrated: true;
    position: relative;
    display: flex;
  }
}
```

## 4. Especificações Técnicas

### 4.1 Navigation Store (Pinia)

```typescript
export const useNavigationStore = defineStore('navigation', () => {
  // Estado
  const currentView = ref<ViewType>(ViewType.GAME);
  const previousView = ref<ViewType | null>(null);
  const viewHistory = ref<ViewType[]>([ViewType.GAME]);
  const isTransitioning = ref(false);
  const transitionDirection = ref<'forward' | 'backward'>('forward');
  
  // Game state preservation
  const preservedGameState = ref<GameState | null>(null);
  
  // Actions
  function navigateTo(view: ViewType, options?: NavigationOptions) {
    if (currentView.value === view || isTransitioning.value) return;
    
    // Preserve game state if leaving game view
    if (currentView.value === ViewType.GAME) {
      preserveGameState();
    }
    
    // Update navigation state
    previousView.value = currentView.value;
    currentView.value = view;
    viewHistory.value.push(view);
    
    // Set transition direction
    transitionDirection.value = options?.direction || 'forward';
    
    // Handle transitions
    startTransition();
  }
  
  function goBack() {
    if (viewHistory.value.length <= 1) return;
    
    viewHistory.value.pop();
    const targetView = viewHistory.value[viewHistory.value.length - 1];
    navigateTo(targetView, { direction: 'backward' });
  }
  
  return {
    currentView: readonly(currentView),
    previousView: readonly(previousView),
    isTransitioning: readonly(isTransitioning),
    navigateTo,
    goBack
  };
});
```

### 4.2 View Container com Transições

```vue
<template>
  <div class="view-container">
    <Transition
      :name="transitionName"
      mode="out-in"
      @before-enter="onBeforeEnter"
      @after-leave="onAfterLeave"
    >
      <component 
        :is="currentViewComponent" 
        :key="currentView"
        class="view"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
const transitionName = computed(() => {
  return navigationStore.transitionDirection === 'forward' 
    ? 'slide-left' 
    : 'slide-right';
});
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
```

### 4.3 Integração com Sistema Existente

```typescript
// Modificações necessárias no GameView.vue
export default {
  beforeRouteLeave() {
    // Salvar estado do jogo
    if (this.gameStore.isPlaying) {
      this.gameStore.pauseGame();
      this.navigationStore.setGameWasPlaying(true);
    }
  },
  
  activated() {
    // Restaurar estado do jogo
    if (this.navigationStore.gameWasPlaying) {
      this.gameStore.resumeGame();
    }
  }
};
```

## 5. Casos de Uso

### 5.1 UC-001: Navegar entre Views
```yaml
caso_uso:
  id: "UC-001"
  título: "Navegar entre Views"
  ator: "Jogador"
  pré-condições:
    - "Aplicativo está aberto"
    - "Menu de navegação visível"
  fluxo:
    1. "Jogador toca/clica em item do menu"
    2. "Sistema salva estado atual (se necessário)"
    3. "Sistema inicia transição animada"
    4. "Sistema carrega nova view"
    5. "Sistema atualiza indicador de menu ativo"
  pós-condições:
    - "Nova view está visível"
    - "Estado anterior preservado"
    - "Menu reflete view ativa"
```

### 5.2 UC-002: Retornar ao Jogo
```yaml
caso_uso:
  id: "UC-002"
  título: "Retornar ao Jogo em Progresso"
  ator: "Jogador"
  pré-condições:
    - "Jogo estava em progresso"
    - "Jogador navegou para outra view"
  fluxo:
    1. "Jogador seleciona 'Início' no menu"
    2. "Sistema detecta jogo em progresso"
    3. "Sistema restaura estado do jogo"
    4. "Sistema remove pausa automática"
    5. "Jogo continua de onde parou"
  pós-condições:
    - "Jogo restaurado completamente"
    - "Timer continua contagem"
    - "Pontuação preservada"
```

## 6. Critérios de Aceitação

### 6.1 Navegação
- [ ] Menu visível e acessível em todas as views
- [ ] Transições suaves entre todas as views
- [ ] Indicador visual da view ativa
- [ ] Suporte a navegação por teclado (desktop)
- [ ] Suporte a gestos touch (mobile)

### 6.2 Preservação de Estado
- [ ] Jogo pausa automaticamente ao navegar
- [ ] Estado completo preservado ao sair
- [ ] Restauração perfeita ao retornar
- [ ] Sem perda de dados durante navegação

### 6.3 Performance
- [ ] Transições < 300ms
- [ ] Sem travamentos durante navegação
- [ ] Memória gerenciada eficientemente
- [ ] Views lazy-loaded quando apropriado

### 6.4 Mobile
- [ ] Menu fixo no bottom em mobile
- [ ] Touch targets mínimo 44x44px
- [ ] Swipe gestures funcionais
- [ ] Landscape mode suportado

## 7. Validação e Testes

### 7.1 Testes de Navegação
```typescript
describe('Navigation System', () => {
  it('should navigate between views smoothly', async () => {
    const { navigateTo } = useNavigationStore();
    
    navigateTo(ViewType.PROFILE);
    await nextTick();
    
    expect(currentView.value).toBe(ViewType.PROFILE);
    expect(previousView.value).toBe(ViewType.GAME);
  });
  
  it('should preserve game state on navigation', async () => {
    const gameStore = useGameStore();
    const initialScore = gameStore.score;
    
    navigateTo(ViewType.SETTINGS);
    await nextTick();
    
    expect(gameStore.isPaused).toBe(true);
    expect(preservedGameState.value.score).toBe(initialScore);
  });
});
```

### 7.2 Testes de UX
- Teste com usuários em dispositivos móveis
- Validação de acessibilidade (WCAG 2.1)
- Testes de performance em dispositivos low-end
- Validação de transições em diferentes navegadores

## 8. Considerações de Implementação

### 8.1 Migração Gradual
1. Implementar NavigationStore primeiro
2. Criar ViewContainer com GameView existente
3. Adicionar novas views uma por vez
4. Substituir StatusBar por NavigationMenu
5. Remover referências a RouterLink

### 8.2 Compatibilidade
- Manter APIs existentes do GameStore
- Preservar funcionalidade de todos os componentes
- Garantir que modais continuem funcionando
- Manter sistema de gamificação intacto

### 8.3 Próximos Passos
1. Revisar e aprovar especificação
2. Criar protótipos de UI/UX
3. Implementar NavigationStore
4. Desenvolver componentes de navegação
5. Integrar com sistema existente
6. Testar extensivamente
7. Deploy gradual com feature flags