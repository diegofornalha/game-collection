import { ref, computed, onUnmounted } from 'vue';

export function useGameTimer() {
  const seconds = ref(0);
  const isRunning = ref(false);
  let interval: number | null = null;
  
  const formattedTime = computed(() => {
    const hours = Math.floor(seconds.value / 3600);
    const minutes = Math.floor((seconds.value % 3600) / 60);
    const secs = seconds.value % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  });
  
  function start() {
    if (!isRunning.value) {
      isRunning.value = true;
      interval = window.setInterval(() => {
        seconds.value++;
      }, 1000);
    }
  }
  
  function pause() {
    isRunning.value = false;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }
  
  function reset() {
    pause();
    seconds.value = 0;
  }
  
  function setTime(newSeconds: number) {
    seconds.value = newSeconds;
  }
  
  onUnmounted(() => {
    pause();
  });
  
  return {
    seconds,
    formattedTime,
    isRunning,
    start,
    pause,
    reset,
    setTime
  };
}