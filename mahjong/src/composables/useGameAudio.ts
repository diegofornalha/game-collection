import { ref, watch } from 'vue';
import { audioService } from '@/services/audio.service';
import { useGamePreferencesStore } from '@/stores/gamePreferences.store';

export function useGameAudio() {
  const preferencesStore = useGamePreferencesStore();
  const isMusicPlaying = ref(false);
  
  // Watch for sound preference changes
  watch(() => preferencesStore.soundEnabled, (enabled) => {
    if (!enabled) {
      audioService.stopAll();
    }
  });
  
  // Watch for music preference changes
  watch(() => preferencesStore.musicEnabled, (enabled) => {
    if (!enabled) {
      stopMusic();
    } else {
      playMusic();
    }
  });
  
  function playSound(soundId: string, delay = 0) {
    if (preferencesStore.soundEnabled) {
      audioService.play(soundId, delay);
    }
  }
  
  function playMusic() {
    if (preferencesStore.musicEnabled && !isMusicPlaying.value) {
      audioService.play('bgmusic', 0, true);
      isMusicPlaying.value = true;
    }
  }
  
  function stopMusic() {
    // Stop background music specifically
    audioService.stopAll();
    isMusicPlaying.value = false;
  }
  
  function playMatch() {
    playSound('match');
  }
  
  function playSelect() {
    playSound('select');
  }
  
  function playError() {
    playSound('error');
  }
  
  function playVictory() {
    playSound('victory');
  }
  
  function playShuffle() {
    playSound('shuffle');
  }
  
  return {
    playSound,
    playMusic,
    stopMusic,
    playMatch,
    playSelect,
    playError,
    playVictory,
    playShuffle,
    isMusicPlaying
  };
}