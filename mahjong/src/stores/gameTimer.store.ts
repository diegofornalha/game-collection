import { defineStore } from 'pinia';
import { useGameStateStore } from './gameState.store';

export const useGameTimerStore = defineStore('gameTimer', () => {
  const stateStore = useGameStateStore();
  
  let timerInterval: number | null = null;
  
  function startTimer() {
    if (!timerInterval && !stateStore.isPaused) {
      timerInterval = window.setInterval(() => {
        if (!stateStore.isPaused && !stateStore.isGameComplete) {
          stateStore.incrementTimer();
        }
      }, 1000);
    }
  }
  
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  
  function pauseGame() {
    stateStore.setPaused(true);
    stopTimer();
  }
  
  function resumeGame() {
    stateStore.setPaused(false);
    startTimer();
  }
  
  function cleanup() {
    stopTimer();
  }
  
  return {
    startTimer,
    stopTimer,
    pauseGame,
    resumeGame,
    cleanup
  };
});