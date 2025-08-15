<template>
  <div class="settings-view">
    <h1 class="page-title">
      <i class="fas fa-cog"></i>
      Configurações
    </h1>
    
    <div class="settings-container">
      <!-- Aparência -->
      <section class="settings-section glass">
        <h2><i class="fas fa-palette"></i> Aparência</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Tema Visual</span>
            <span class="setting-description">Escolha o tema da interface</span>
          </div>
          <div class="theme-selector">
            <button 
              class="theme-option" 
              :class="{active: currentTheme === 'dark'}"
              @click="setTheme('dark')"
            >
              <i class="fas fa-moon"></i>
              <span>Escuro</span>
            </button>
            <button 
              class="theme-option" 
              :class="{active: currentTheme === 'light'}"
              @click="setTheme('light')"
            >
              <i class="fas fa-sun"></i>
              <span>Claro</span>
            </button>
            <button 
              class="theme-option" 
              :class="{active: currentTheme === 'auto'}"
              @click="setTheme('auto')"
            >
              <i class="fas fa-adjust"></i>
              <span>Auto</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Som e Áudio -->
      <section class="settings-section glass">
        <h2><i class="fas fa-volume-up"></i> Som e Áudio</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Efeitos Sonoros</span>
            <span class="setting-description">Sons de clique e feedback</span>
          </div>
          <button 
            @click="toggleSound" 
            class="toggle-button"
            :class="{ active: soundEnabled }"
          >
            <i :class="soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
            {{ soundEnabled ? 'Ligado' : 'Desligado' }}
          </button>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Música de Fundo</span>
            <span class="setting-description">Música ambiente relaxante</span>
          </div>
          <button 
            @click="toggleMusic" 
            class="toggle-button"
            :class="{ active: musicEnabled }"
          >
            <i :class="musicEnabled ? 'fas fa-music' : 'fas fa-music'"></i>
            {{ musicEnabled ? 'Ligada' : 'Desligada' }}
          </button>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Volume Geral</span>
            <span class="setting-description">Ajustar volume do jogo</span>
          </div>
          <div class="volume-control">
            <input 
              type="range" 
              min="0" 
              max="100" 
              v-model="volume"
              class="volume-slider"
            >
            <span class="volume-value">{{ volume }}%</span>
          </div>
        </div>
      </section>

      <!-- Gameplay -->
      <section class="settings-section glass">
        <h2><i class="fas fa-gamepad"></i> Gameplay</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Velocidade da Animação</span>
            <span class="setting-description">Velocidade das transições e efeitos</span>
          </div>
          <select 
            v-model="animationSpeed" 
            @change="updateAnimationSpeed"
            class="select-control"
          >
            <option value="slow">Lenta</option>
            <option value="normal">Normal</option>
            <option value="fast">Rápida</option>
          </select>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Dicas Visuais</span>
            <span class="setting-description">Destacar peças disponíveis</span>
          </div>
          <button 
            @click="toggleHints" 
            class="toggle-button"
            :class="{ active: hintsEnabled }"
          >
            <i :class="hintsEnabled ? 'fas fa-lightbulb' : 'far fa-lightbulb'"></i>
            {{ hintsEnabled ? 'Ativadas' : 'Desativadas' }}
          </button>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Timer</span>
            <span class="setting-description">Mostrar tempo de jogo</span>
          </div>
          <button 
            @click="toggleTimer" 
            class="toggle-button"
            :class="{ active: timerEnabled }"
          >
            <i :class="timerEnabled ? 'fas fa-clock' : 'far fa-clock'"></i>
            {{ timerEnabled ? 'Visível' : 'Oculto' }}
          </button>
        </div>
      </section>

      <!-- Notificações -->
      <section class="settings-section glass">
        <h2><i class="fas fa-bell"></i> Notificações</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Lembretes Diários</span>
            <span class="setting-description">Lembrar de manter a ofensiva</span>
          </div>
          <button 
            @click="toggleNotifications" 
            class="toggle-button"
            :class="{ active: notificationsEnabled }"
          >
            <i :class="notificationsEnabled ? 'fas fa-bell' : 'fas fa-bell-slash'"></i>
            {{ notificationsEnabled ? 'Ativados' : 'Desativados' }}
          </button>
        </div>
      </section>

      <!-- Dados e Privacidade -->
      <section class="settings-section glass">
        <h2><i class="fas fa-shield-alt"></i> Dados e Privacidade</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Salvar Progresso</span>
            <span class="setting-description">Salvar automaticamente o jogo</span>
          </div>
          <button 
            @click="toggleAutoSave" 
            class="toggle-button"
            :class="{ active: autoSaveEnabled }"
          >
            <i :class="autoSaveEnabled ? 'fas fa-save' : 'far fa-save'"></i>
            {{ autoSaveEnabled ? 'Automático' : 'Manual' }}
          </button>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Limpar Dados</span>
            <span class="setting-description">Apagar todo o progresso</span>
          </div>
          <button 
            @click="clearData" 
            class="danger-button"
          >
            <i class="fas fa-trash"></i>
            Limpar Dados
          </button>
        </div>
      </section>

      <!-- Sobre -->
      <section class="settings-section glass">
        <h2><i class="fas fa-info-circle"></i> Sobre</h2>
        
        <div class="about-info">
          <p><strong>Mahjong Solitaire</strong></p>
          <p>Versão 2.0.0</p>
          <p class="credits">Desenvolvido com ❤️ usando Vue.js</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useThemeStore } from '@/stores/theme.store';
import { useGamePreferencesStore } from '@/stores/gamePreferences.store';

const themeStore = useThemeStore();
const preferencesStore = useGamePreferencesStore();

// Theme
const currentTheme = computed(() => themeStore.currentTheme);

// Settings from preferences store
const soundEnabled = computed({
  get: () => preferencesStore.soundEnabled,
  set: (value) => preferencesStore.updatePreferences({ soundEnabled: value })
});

const animationSpeed = computed({
  get: () => preferencesStore.animationSpeed,
  set: (value) => preferencesStore.setAnimationSpeed(value as 'slow' | 'normal' | 'fast')
});

// Additional settings
const musicEnabled = ref(false);
const volume = ref(50);
const hintsEnabled = ref(true);
const timerEnabled = ref(true);
const notificationsEnabled = ref(false);
const autoSaveEnabled = ref(true);

// Load additional settings from localStorage
onMounted(() => {
  const settings = localStorage.getItem('gameSettings');
  if (settings) {
    const parsed = JSON.parse(settings);
    musicEnabled.value = parsed.musicEnabled ?? false;
    volume.value = parsed.volume ?? 50;
    hintsEnabled.value = parsed.hintsEnabled ?? true;
    timerEnabled.value = parsed.timerEnabled ?? true;
    notificationsEnabled.value = parsed.notificationsEnabled ?? false;
    autoSaveEnabled.value = parsed.autoSaveEnabled ?? true;
  }
});

// Save additional settings to localStorage
const saveAdditionalSettings = () => {
  const settings = {
    musicEnabled: musicEnabled.value,
    volume: volume.value,
    hintsEnabled: hintsEnabled.value,
    timerEnabled: timerEnabled.value,
    notificationsEnabled: notificationsEnabled.value,
    autoSaveEnabled: autoSaveEnabled.value,
  };
  localStorage.setItem('gameSettings', JSON.stringify(settings));
};

// Watch for changes and save
watch([musicEnabled, volume, hintsEnabled, timerEnabled, notificationsEnabled, autoSaveEnabled], () => {
  saveAdditionalSettings();
});

// Theme functions
const setTheme = (theme: 'light' | 'dark' | 'auto') => {
  themeStore.setTheme(theme);
};

// Toggle functions
const toggleSound = () => {
  preferencesStore.toggleSound();
};

const toggleMusic = () => {
  musicEnabled.value = !musicEnabled.value;
};

const toggleHints = () => {
  hintsEnabled.value = !hintsEnabled.value;
};

const toggleTimer = () => {
  timerEnabled.value = !timerEnabled.value;
};

const toggleNotifications = () => {
  notificationsEnabled.value = !notificationsEnabled.value;
  if (notificationsEnabled.value) {
    requestNotificationPermission();
  }
};

const toggleAutoSave = () => {
  autoSaveEnabled.value = !autoSaveEnabled.value;
};

const updateAnimationSpeed = () => {
  // Animation speed is already updated through v-model
};

// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// Clear all data
const clearData = () => {
  if (confirm('Tem certeza que deseja apagar todo o progresso? Esta ação não pode ser desfeita.')) {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  }
};
</script>

<style scoped lang="scss">
.settings-view {
  padding: 20px;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.page-title {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 30px;
  color: var(--primary-color);
  text-shadow: var(--shadow-sm);
  
  i {
    margin-right: 10px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  padding: 24px;
  border-radius: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 10px;
    
    i {
      font-size: 1.2rem;
      color: var(--primary-color);
    }
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
}

.setting-info {
  flex: 1;
}

.setting-label {
  display: block;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.setting-description {
  display: block;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

// Theme selector
.theme-selector {
  display: flex;
  gap: 8px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: var(--button-bg);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  
  i {
    font-size: 1.2rem;
  }
  
  span {
    font-size: 0.85rem;
  }
  
  &:hover {
    background: var(--hover-bg);
    transform: translateY(-2px);
  }
  
  &.active {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    border-color: var(--primary-color);
    color: white;
    box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
  }
}

// Select control
.select-control {
  padding: 10px 16px;
  background: var(--button-bg);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--hover-bg);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--focus-color);
  }
}

// Toggle buttons
.toggle-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--button-bg);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  
  i {
    font-size: 1.1rem;
  }
  
  &:hover {
    background: var(--hover-bg);
    transform: translateY(-2px);
  }
  
  &.active {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    border-color: var(--primary-color);
    color: white;
    box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
  }
}

// Volume control
.volume-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-slider {
  width: 150px;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 0 8px rgba(66, 184, 131, 0.5);
    }
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 0 8px rgba(66, 184, 131, 0.5);
    }
  }
}

.volume-value {
  min-width: 45px;
  font-weight: 500;
  color: var(--text-primary);
}

// Danger button
.danger-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 2px solid var(--error-color);
  border-radius: 12px;
  color: var(--error-color);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  
  i {
    font-size: 1.1rem;
  }
  
  &:hover {
    background: var(--error-color);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(238, 90, 82, 0.3);
  }
}

// About section
.about-info {
  text-align: center;
  padding: 20px;
  
  p {
    margin: 8px 0;
    color: var(--text-secondary);
    
    &:first-child {
      font-size: 1.2rem;
      color: var(--text-primary);
    }
  }
  
  .credits {
    margin-top: 16px;
    font-size: 0.9rem;
    color: var(--text-tertiary);
  }
}

// Glassmorphism effect
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

// Responsive
@media (max-width: 768px) {
  .settings-view {
    padding: 10px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .settings-section {
    padding: 16px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .theme-selector {
    width: 100%;
    
    .theme-option {
      flex: 1;
    }
  }
  
  .volume-control {
    width: 100%;
    
    .volume-slider {
      flex: 1;
    }
  }
}
</style>