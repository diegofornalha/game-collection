<template>
  <div class="animation-demo">
    <h2>Demo de Animação de Tokens</h2>
    
    <div class="demo-controls">
      <button 
        @click="triggerSmallGain" 
        class="demo-button small"
      >
        +10 Tokens
      </button>
      
      <button 
        @click="triggerMediumGain" 
        class="demo-button medium"
      >
        +50 Tokens
      </button>
      
      <button 
        @click="triggerLargeGain" 
        class="demo-button large"
      >
        +100 Tokens
      </button>
      
      <button 
        @click="triggerCustomGain" 
        class="demo-button custom"
      >
        Custom (+{{ customAmount }})
      </button>
      
      <input 
        v-model.number="customAmount" 
        type="number" 
        min="1" 
        max="1000"
        class="custom-input"
      >
    </div>
    
    <div class="demo-display">
      <TokenDisplay
        :tokens="currentTokens"
        :show-particle-animation="true"
        :animation-source="lastClickedButton"
        @tokens-changed="onTokensChanged"
      />
    </div>
    
    <div class="demo-info">
      <p>Tokens atuais: {{ currentTokens }}</p>
      <p>Última mudança: {{ lastChange > 0 ? '+' : '' }}{{ lastChange }}</p>
      <p>Total de animações: {{ animationCount }}</p>
    </div>
    
    <div class="settings">
      <h3>Configurações</h3>
      <label>
        <input type="checkbox" v-model="isMobileOptimized">
        Otimização Mobile
      </label>
      <label>
        <input type="checkbox" v-model="showGlow">
        Mostrar Brilho
      </label>
      <label>
        Partículas: 
        <input 
          type="range" 
          min="5" 
          max="50" 
          v-model.number="particleCount"
        >
        {{ particleCount }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TokenDisplay from '../TokenDisplay.vue'

const currentTokens = ref(100)
const lastChange = ref(0)
const animationCount = ref(0)
const customAmount = ref(25)
const lastClickedButton = ref<HTMLElement | null>(null)

// Configurações
const isMobileOptimized = ref(true)
const showGlow = ref(true)
const particleCount = ref(20)

function updateTokens(amount: number, event: MouseEvent) {
  lastClickedButton.value = event.target as HTMLElement
  currentTokens.value += amount
  lastChange.value = amount
  animationCount.value++
}

function triggerSmallGain(event: MouseEvent) {
  updateTokens(10, event)
}

function triggerMediumGain(event: MouseEvent) {
  updateTokens(50, event)
}

function triggerLargeGain(event: MouseEvent) {
  updateTokens(100, event)
}

function triggerCustomGain(event: MouseEvent) {
  updateTokens(customAmount.value, event)
}

function onTokensChanged(oldValue: number, newValue: number) {
  console.log(`Tokens mudaram de ${oldValue} para ${newValue}`)
}
</script>

<style scoped>
.animation-demo {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary);
}

.demo-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.demo-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.demo-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.5s, height 0.5s;
}

.demo-button:active::before {
  width: 300px;
  height: 300px;
}

.demo-button.small {
  background: var(--green-500);
  color: white;
}

.demo-button.medium {
  background: var(--blue-500);
  color: white;
}

.demo-button.large {
  background: var(--purple-500);
  color: white;
}

.demo-button.custom {
  background: var(--yellow-500);
  color: var(--gray-900);
}

.demo-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.custom-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 1rem;
}

.demo-display {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  padding: 2rem;
  background: var(--gray-50);
  border-radius: var(--border-radius-md);
}

.demo-info {
  text-align: center;
  margin-top: 2rem;
  padding: 1rem;
  background: var(--gray-100);
  border-radius: var(--border-radius-md);
}

.demo-info p {
  margin: 0.5rem 0;
  color: var(--text-secondary);
}

.settings {
  margin-top: 2rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.settings h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.settings label {
  display: block;
  margin: 0.5rem 0;
  color: var(--text-secondary);
}

.settings input[type="checkbox"] {
  margin-right: 0.5rem;
}

.settings input[type="range"] {
  width: 200px;
  margin: 0 1rem;
}

/* Tema escuro */
@media (prefers-color-scheme: dark) {
  .animation-demo {
    background: var(--surface-color-dark);
  }
  
  .demo-display {
    background: var(--gray-800);
  }
  
  .demo-info {
    background: var(--gray-700);
  }
  
  .custom-input {
    background: var(--gray-700);
    border-color: var(--border-color-dark);
    color: var(--text-primary-dark);
  }
}

/* Mobile */
@media (max-width: 600px) {
  .animation-demo {
    margin: 1rem;
    padding: 1rem;
  }
  
  .demo-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .demo-button {
    width: 100%;
  }
  
  .settings input[type="range"] {
    width: 150px;
  }
}
</style>