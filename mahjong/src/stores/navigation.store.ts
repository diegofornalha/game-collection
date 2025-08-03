import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ViewType = 'home' | 'game' | 'profile' | 'settings' | 'achievements' | 'store';

interface GameSnapshot {
  tiles: any[];
  score: number;
  timer: number;
  isPaused: boolean;
  // Adicionar outros estados relevantes conforme necessário
}

export const useNavigationStore = defineStore('navigation', () => {
  // Estado
  const currentView = ref<ViewType>('game'); // Começa no jogo
  const previousView = ref<ViewType | null>(null);
  const navigationHistory = ref<ViewType[]>(['game']);
  const gameSnapshot = ref<GameSnapshot | null>(null);
  const isMenuOpen = ref(false);
  const isBottomNavVisible = ref(true);
  const isTransitioning = ref(false);
  const transitionDirection = ref<'forward' | 'backward'>('forward');

  // Getters
  const canGoBack = computed(() => navigationHistory.value.length > 1);
  const isInGame = computed(() => currentView.value === 'game');
  const currentViewTitle = computed(() => {
    const titles: Record<ViewType, string> = {
      home: 'Início',
      game: 'Mahjong',
      profile: 'Perfil',
      settings: 'Configurações',
      achievements: 'Atalhos',
      store: 'Loja'
    };
    return titles[currentView.value];
  });

  // Actions
  function navigateTo(view: ViewType) {
    if (currentView.value === view) return;

    // Preservar estado do jogo antes de sair
    if (currentView.value === 'game' && view !== 'game') {
      preserveGameState();
    }

    previousView.value = currentView.value;
    currentView.value = view;
    navigationHistory.value.push(view);

    // Limitar histórico a 10 itens
    if (navigationHistory.value.length > 10) {
      navigationHistory.value.shift();
    }

    // Fechar menu ao navegar
    isMenuOpen.value = false;
  }

  function goBack() {
    if (!canGoBack.value) return;

    // Remove current view from history
    navigationHistory.value.pop();
    
    // Get previous view
    const previous = navigationHistory.value[navigationHistory.value.length - 1];
    
    if (previous) {
      currentView.value = previous;
      previousView.value = navigationHistory.value[navigationHistory.value.length - 2] || null;
    }
  }

  function preserveGameState() {
    // Esta função será chamada pelos componentes do jogo
    // para salvar o estado atual
    console.log('Preserving game state...');
  }

  function restoreGameState() {
    // Esta função será chamada quando voltar ao jogo
    if (gameSnapshot.value) {
      console.log('Restoring game state...');
      return gameSnapshot.value;
    }
    return null;
  }

  function setGameSnapshot(snapshot: GameSnapshot) {
    gameSnapshot.value = snapshot;
  }

  function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
  }

  function closeMenu() {
    isMenuOpen.value = false;
  }

  // Reset navigation to game
  function resetToGame() {
    currentView.value = 'game';
    previousView.value = null;
    navigationHistory.value = ['game'];
    isMenuOpen.value = false;
  }

  function setTransitioning(value: boolean) {
    isTransitioning.value = value;
  }

  function setBottomNavVisible(value: boolean) {
    isBottomNavVisible.value = value;
  }

  return {
    // Estado
    currentView,
    previousView,
    navigationHistory,
    gameSnapshot,
    isMenuOpen,
    isBottomNavVisible,
    isTransitioning,
    transitionDirection,

    // Getters
    canGoBack,
    isInGame,
    currentViewTitle,

    // Actions
    navigateTo,
    goBack,
    preserveGameState,
    restoreGameState,
    setGameSnapshot,
    toggleMenu,
    closeMenu,
    resetToGame,
    setTransitioning,
    setBottomNavVisible
  };
});