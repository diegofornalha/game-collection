<template>
  <div class="settings-view">
    <div class="settings-header">
      <h1>Configurações</h1>
    </div>

    <div class="settings-sections">
      <!-- Audio Settings -->
      <section class="settings-section">
        <h2><i class="fas fa-volume-up"></i> Áudio</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Efeitos Sonoros</span>
            <span class="setting-description">Sons de clique e feedback</span>
          </div>
          <button 
            @click="toggleSound" 
            :class="['toggle-button', { active: preferences.soundEnabled }]"
          >
            <i :class="preferences.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Música de Fundo</span>
            <span class="setting-description">Música ambiente relaxante</span>
          </div>
          <button 
            @click="toggleMusic" 
            :class="['toggle-button', { active: preferences.musicEnabled }]"
          >
            <i :class="preferences.musicEnabled ? 'fas fa-music' : 'fas fa-music-slash'"></i>
          </button>
        </div>
      </section>

      <!-- Game Settings -->
      <section class="settings-section">
        <h2><i class="fas fa-gamepad"></i> Jogo</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Dicas</span>
            <span class="setting-description">Mostrar dicas disponíveis</span>
          </div>
          <button 
            @click="toggleHints" 
            :class="['toggle-button', { active: preferences.hintsEnabled }]"
          >
            <i :class="preferences.hintsEnabled ? 'fas fa-lightbulb' : 'fas fa-lightbulb-slash'"></i>
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Velocidade de Animação</span>
            <span class="setting-description">Velocidade das animações do jogo</span>
          </div>
          <div class="button-group">
            <button 
              v-for="speed in animationSpeeds" 
              :key="speed.value"
              @click="setAnimationSpeed(speed.value)"
              :class="['option-button', { active: preferences.animationSpeed === speed.value }]"
            >
              {{ speed.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- Visual Settings -->
      <section class="settings-section">
        <h2><i class="fas fa-palette"></i> Visual</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Tema</span>
            <span class="setting-description">Aparência do jogo</span>
          </div>
          <div class="button-group">
            <button 
              v-for="theme in themes" 
              :key="theme.value"
              @click="setTheme(theme.value)"
              :class="['option-button', { active: preferences.theme === theme.value }]"
            >
              <i :class="theme.icon"></i>
              {{ theme.label }}
            </button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Conjunto de Peças</span>
            <span class="setting-description">Estilo visual das peças</span>
          </div>
          <div class="button-group">
            <button 
              v-for="tileSet in tileSets" 
              :key="tileSet.value"
              @click="setTileSet(tileSet.value)"
              :class="['option-button', { active: preferences.tileSet === tileSet.value }]"
            >
              {{ tileSet.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="settings-section actions">
        <button @click="resetSettings" class="reset-button">
          <i class="fas fa-undo"></i>
          Restaurar Padrões
        </button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/game.store';
import { preferencesService, type UserPreferences } from '../../services/preferences.service';

const gameStore = useGameStore();
const preferences = computed(() => gameStore.preferences);

const animationSpeeds = [
  { value: 'slow', label: 'Lenta' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Rápida' }
] as const;

const themes = [
  { value: 'classic', label: 'Clássico', icon: 'fas fa-sun' },
  { value: 'modern', label: 'Moderno', icon: 'fas fa-cube' },
  { value: 'dark', label: 'Escuro', icon: 'fas fa-moon' }
] as const;

const tileSets = [
  { value: 'traditional', label: 'Tradicional' },
  { value: 'simple', label: 'Simples' },
  { value: 'colorful', label: 'Colorido' }
] as const;

async function toggleSound() {
  await gameStore.updatePreferences({ soundEnabled: !preferences.value.soundEnabled });
}

async function toggleMusic() {
  await gameStore.updatePreferences({ musicEnabled: !preferences.value.musicEnabled });
}

async function toggleHints() {
  await gameStore.updatePreferences({ hintsEnabled: !preferences.value.hintsEnabled });
}

async function setAnimationSpeed(speed: UserPreferences['animationSpeed']) {
  await gameStore.updatePreferences({ animationSpeed: speed });
}

async function setTheme(theme: UserPreferences['theme']) {
  await gameStore.updatePreferences({ theme });
}

async function setTileSet(tileSet: UserPreferences['tileSet']) {
  await gameStore.updatePreferences({ tileSet });
}

async function resetSettings() {
  if (confirm('Deseja restaurar todas as configurações para os valores padrão?')) {
    await preferencesService.resetPreferences();
    gameStore.loadPreferences();
  }
}
</script>

<style scoped>
.settings-view {
  height: 100%;
  overflow-y: auto;
  padding: 2rem 1.5rem;
  padding-top: 3rem;
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  text-align: center;
  margin-bottom: 2rem;
}

.settings-header h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.settings-section h2 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.settings-section h2 i {
  color: var(--primary-color);
  font-size: 1rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.setting-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.toggle-button {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-md);
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.toggle-button:hover {
  background: var(--hover-bg);
  transform: translateY(-1px);
}

.toggle-button:active {
  transform: translateY(0);
}

.toggle-button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.option-button {
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-button:hover {
  background: var(--hover-bg);
  transform: translateY(-1px);
}

.option-button:active {
  transform: translateY(0);
}

.option-button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.reset-button {
  width: 100%;
  padding: 1rem;
  border-radius: var(--border-radius-md);
  border: 2px solid var(--error);
  background: transparent;
  color: var(--error);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.reset-button:hover {
  background: var(--error);
  color: white;
}

.actions {
  background: transparent;
  box-shadow: none;
  padding: 0;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .settings-view {
    padding: 1rem;
    padding-top: 2rem;
    padding-bottom: 80px; /* Space for bottom nav */
  }
  
  .settings-section {
    padding: 1rem;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .button-group {
    width: 100%;
    justify-content: flex-start;
  }
  
  .toggle-button {
    align-self: flex-end;
  }
}

/* FontAwesome icon fixes for slash icons */
.fa-volume-mute::before {
  content: "\f6a9";
}

.fa-music-slash::before {
  content: "\f8d1";
}

.fa-lightbulb-slash::before {
  content: "\f673";
}
</style>