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
            <span class="setting-label">Embaralhamento Automático</span>
            <span class="setting-description">Embaralhar quando não houver movimentos</span>
          </div>
          <button 
            @click="toggleAutoShuffle" 
            :class="['toggle-button', { active: preferences.autoShuffleEnabled }]"
          >
            <i :class="preferences.autoShuffleEnabled ? 'fas fa-shuffle' : 'fas fa-ban'"></i>
          </button>
        </div>

        <div v-if="preferences.autoShuffleEnabled" class="setting-item">
          <div class="setting-info">
            <span class="setting-label">Tempo de Espera</span>
            <span class="setting-description">{{ formattedAutoShuffleDelay }} antes de embaralhar</span>
          </div>
          <div class="delay-buttons">
            <button 
              v-for="delay in autoShuffleDelays" 
              :key="delay.value"
              @click="setAutoShuffleDelay(delay.value)"
              :class="['delay-button', { active: preferences.autoShuffleDelay === delay.value }]"
            >
              {{ delay.label }}
            </button>
          </div>
        </div>

      </section>

      <!-- Visual Settings -->
      <section class="settings-section">
        <h2><i class="fas fa-palette"></i> Visual</h2>
        
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
import { useGameStore } from '@/stores/game.store';
import { preferencesService, type UserPreferences } from '@/services/preferences.service';

const gameStore = useGameStore();
const preferences = computed(() => gameStore.preferences);

const tileSets = [
  { value: 'traditional', label: 'Tradicional' },
  { value: 'simple', label: 'Simples' },
  { value: 'colorful', label: 'Colorido' }
] as const;

const autoShuffleDelays = [
  { value: 1000, label: '1s' },
  { value: 2000, label: '2s' },
  { value: 3000, label: '3s' },
  { value: 5000, label: '5s' },
  { value: 10000, label: '10s' }
];

const formattedAutoShuffleDelay = computed(() => {
  const seconds = preferences.value.autoShuffleDelay / 1000;
  return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
});

async function toggleSound() {
  await gameStore.updatePreferences({ soundEnabled: !preferences.value.soundEnabled });
}

async function toggleHints() {
  await gameStore.updatePreferences({ hintsEnabled: !preferences.value.hintsEnabled });
}

async function setTileSet(tileSet: UserPreferences['tileSet']) {
  await gameStore.updatePreferences({ tileSet });
}

async function toggleAutoShuffle() {
  await gameStore.updatePreferences({ autoShuffleEnabled: !preferences.value.autoShuffleEnabled });
}

async function setAutoShuffleDelay(delay: number) {
  await gameStore.updatePreferences({ autoShuffleDelay: delay });
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

.delay-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.delay-button {
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  min-width: 50px;
  text-align: center;
}

.delay-button:hover {
  background: var(--hover-bg);
  transform: translateY(-1px);
}

.delay-button:active {
  transform: translateY(0);
}

.delay-button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
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
  
  .delay-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .delay-button {
    flex: 1;
    min-width: 45px;
  }
}

/* FontAwesome icon fixes for slash icons */
.fa-volume-mute::before {
  content: "\f6a9";
}

.fa-lightbulb-slash::before {
  content: "\f673";
}

.fa-shuffle::before {
  content: "\f074";
}

.fa-ban::before {
  content: "\f05e";
}
</style>