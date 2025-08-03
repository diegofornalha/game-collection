import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameActionsStore } from '@/stores/gameActions.store';
import { useGameStateStore } from '@/stores/gameState.store';
import { useGameTimerStore } from '@/stores/gameTimer.store';
import { useGamePreferencesStore } from '@/stores/gamePreferences.store';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useGameKeyboard() {
  const router = useRouter();
  const actionsStore = useGameActionsStore();
  const stateStore = useGameStateStore();
  const timerStore = useGameTimerStore();
  const preferencesStore = useGamePreferencesStore();
  
  const shortcuts: KeyboardShortcut[] = [
    // Game controls
    {
      key: 'z',
      ctrl: true,
      description: 'Desfazer jogada',
      action: () => actionsStore.undo()
    },
    {
      key: 'y',
      ctrl: true,
      description: 'Refazer jogada',
      action: () => actionsStore.redo()
    },
    {
      key: 'h',
      description: 'Mostrar/esconder dica',
      action: () => {
        if (stateStore.showHint) {
          actionsStore.stopHint();
        } else {
          actionsStore.requestHint();
        }
      }
    },
    {
      key: 'p',
      description: 'Pausar/continuar jogo',
      action: () => {
        if (stateStore.isPaused) {
          timerStore.resumeGame();
        } else {
          timerStore.pauseGame();
        }
      }
    },
    {
      key: 'n',
      ctrl: true,
      description: 'Novo jogo',
      action: () => router.push('/game/new')
    },
    {
      key: 's',
      description: 'Alternar som',
      action: () => preferencesStore.toggleSound()
    },
    {
      key: 'm',
      description: 'Alternar música',
      action: () => preferencesStore.toggleMusic()
    },
    {
      key: 'Escape',
      description: 'Limpar seleção',
      action: () => {
        if (stateStore.selectedTile) {
          stateStore.selectedTile.unselect();
          stateStore.selectedTile = null;
        }
      }
    },
    // Navigation
    {
      key: 'F1',
      description: 'Ajuda',
      action: () => router.push('/help')
    },
    {
      key: 'F2',
      description: 'Configurações',
      action: () => router.push('/settings')
    },
    {
      key: 'F3',
      description: 'Conquistas',
      action: () => router.push('/achievements')
    },
    {
      key: 'F4',
      description: 'Estatísticas',
      action: () => router.push('/stats')
    }
  ];
  
  function handleKeydown(event: KeyboardEvent) {
    // Ignore if user is typing in an input field
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = s.alt ? event.altKey : !event.altKey;
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch;
    });
    
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }
  
  function getShortcuts() {
    return shortcuts;
  }
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
  
  return {
    shortcuts,
    getShortcuts
  };
}