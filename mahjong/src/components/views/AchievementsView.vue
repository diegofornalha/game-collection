<template>
  <div class="shortcuts-view">
    <div class="shortcuts-header">
      <h1>Atalhos do Teclado</h1>
      <p class="subtitle">Comandos rápidos para melhorar sua jogabilidade</p>
    </div>

    <div class="shortcuts-sections">
      <!-- Game Controls -->
      <section class="shortcuts-section">
        <h2><i class="fas fa-gamepad"></i> Controles do Jogo</h2>
        
        <div class="shortcut-list">
          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>H</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Dica</span>
              <span class="shortcut-detail">Mostra uma jogada possível</span>
            </div>
          </div>

          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>Ctrl</kbd> + <kbd>Z</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Desfazer</span>
              <span class="shortcut-detail">Desfaz a última jogada</span>
            </div>
          </div>

          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>Ctrl</kbd> + <kbd>Y</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Refazer</span>
              <span class="shortcut-detail">Refaz a jogada desfeita</span>
            </div>
          </div>

          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>P</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Pausar</span>
              <span class="shortcut-detail">Pausa ou continua o jogo</span>
            </div>
          </div>

          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>N</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Novo Jogo</span>
              <span class="shortcut-detail">Inicia um novo jogo</span>
            </div>
          </div>

          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>E</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Embaralhar</span>
              <span class="shortcut-detail">Reorganiza as peças disponíveis</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Navigation -->
      <section class="shortcuts-section">
        <h2><i class="fas fa-compass"></i> Navegação</h2>
        
        <div class="shortcut-list">
          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>Esc</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Menu Principal</span>
              <span class="shortcut-detail">Volta ao menu principal</span>
            </div>
          </div>

          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>Tab</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Alternar Foco</span>
              <span class="shortcut-detail">Navega entre elementos</span>
            </div>
          </div>

          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>Enter</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Selecionar</span>
              <span class="shortcut-detail">Confirma seleção atual</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Audio Controls -->
      <section class="shortcuts-section">
        <h2><i class="fas fa-volume-up"></i> Controles de Áudio</h2>
        
        <div class="shortcut-list">
          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>M</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Mutar Som</span>
              <span class="shortcut-detail">Liga/desliga os efeitos sonoros</span>
            </div>
          </div>

          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>Ctrl</kbd> + <kbd>M</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Mutar Música</span>
              <span class="shortcut-detail">Liga/desliga a música de fundo</span>
            </div>
          </div>
        </div>
      </section>

      <!-- View Controls -->
      <section class="shortcuts-section">
        <h2><i class="fas fa-eye"></i> Controles de Visualização</h2>
        
        <div class="shortcut-list">
          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>F</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Tela Cheia</span>
              <span class="shortcut-detail">Alterna modo tela cheia</span>
            </div>
          </div>

          <div class="shortcut-item">
            <div class="shortcut-keys">
              <kbd>+</kbd> / <kbd>-</kbd>
            </div>
            <div class="shortcut-description">
              <span class="shortcut-name">Zoom</span>
              <span class="shortcut-detail">Aumenta ou diminui o zoom</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="shortcuts-footer">
      <p class="tip">
        <i class="fas fa-info-circle"></i>
        Dica: Estes atalhos funcionam apenas quando o jogo está em foco
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Shortcuts view - displays keyboard shortcuts
</script>

<style scoped>
.shortcuts-view {
  height: 100%;
  overflow-y: auto;
  padding: 2rem 1.5rem;
  padding-top: 3rem;
  max-width: 800px;
  margin: 0 auto;
}

.shortcuts-header {
  text-align: center;
  margin-bottom: 2rem;
}

.shortcuts-header h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.shortcuts-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.shortcuts-section {
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.shortcuts-section h2 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.shortcuts-section h2 i {
  color: var(--primary-color);
  font-size: 1rem;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.shortcut-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
}

kbd {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.shortcut-description {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.shortcut-name {
  font-weight: 500;
  color: var(--text-primary);
}

.shortcut-detail {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.shortcuts-footer {
  margin-top: 2rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  text-align: center;
}

.tip {
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tip i {
  color: var(--primary-color);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .shortcuts-view {
    padding: 1rem;
    padding-top: 2rem;
    padding-bottom: 80px; /* Space for bottom nav */
  }
  
  .shortcuts-section {
    padding: 1rem;
  }
  
  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .shortcut-keys {
    min-width: auto;
  }
  
  kbd {
    font-size: 0.75rem;
    padding: 0.2rem 0.4rem;
  }
}
</style>