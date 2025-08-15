import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { preferencesService, UserPreferences } from '@/services/preferences.service';

export const useGamePreferencesStore = defineStore('gamePreferences', () => {
  // Preferences state
  const preferences = ref<UserPreferences>(preferencesService.getCurrentPreferences());
  
  // Computed getters for individual preferences
  const soundEnabled = computed(() => preferences.value.soundEnabled);
  const musicEnabled = computed(() => preferences.value.musicEnabled);
  const animationSpeed = computed(() => preferences.value.animationSpeed);
  const theme = computed(() => preferences.value.theme);
  const autoShuffleEnabled = computed(() => preferences.value.autoShuffleEnabled);
  const autoShuffleDelay = computed(() => preferences.value.autoShuffleDelay);
  
  // Actions
  async function updatePreferences(updates: Partial<UserPreferences>) {
    preferences.value = await preferencesService.updatePreferences(updates);
  }
  
  function toggleSound() {
    updatePreferences({ soundEnabled: !soundEnabled.value });
  }
  
  function toggleMusic() {
    updatePreferences({ musicEnabled: !musicEnabled.value });
  }
  
  function setAutoShuffle(enabled: boolean) {
    updatePreferences({ autoShuffleEnabled: enabled });
  }
  
  function setAutoShuffleDelay(delay: number) {
    const validDelay = Math.max(1000, Math.min(10000, delay)); // Between 1-10 seconds
    updatePreferences({ autoShuffleDelay: validDelay });
  }
  
  function setAnimationSpeed(speed: 'slow' | 'normal' | 'fast') {
    updatePreferences({ animationSpeed: speed });
  }
  
  function setTheme(theme: 'classic' | 'modern' | 'dark') {
    updatePreferences({ theme: theme as any }); // Cast temporário até atualizar UserPreferences
  }
  
  // Load preferences on startup
  function loadPreferences() {
    preferences.value = preferencesService.getCurrentPreferences();
  }
  
  // Initialize preferences
  loadPreferences();
  
  return {
    // State
    preferences,
    soundEnabled,
    musicEnabled,
    animationSpeed,
    theme,
    autoShuffleEnabled,
    autoShuffleDelay,
    
    // Actions
    updatePreferences,
    toggleSound,
    toggleMusic,
    setAutoShuffle,
    setAutoShuffleDelay,
    setAnimationSpeed,
    setTheme,
    loadPreferences
  };
});