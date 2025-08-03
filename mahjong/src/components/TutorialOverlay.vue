<template>
  <transition name="fade">
    <div v-if="showTutorial" class="tutorial-overlay">
      <div class="tutorial-backdrop" @click="skipTutorial"></div>
      
      <div class="tutorial-content" :class="{ 'mobile': isMobile }">
        <!-- Step indicator -->
        <div class="step-indicator">
          <div 
            v-for="(step, index) in tutorialSteps" 
            :key="index"
            class="step-dot"
            :class="{ 'active': currentStep === index, 'completed': currentStep > index }"
          ></div>
        </div>
        
        <!-- Tutorial card -->
        <div class="tutorial-card" :style="cardPosition">
          <h3>{{ currentStepData.title }}</h3>
          <p>{{ currentStepData.description }}</p>
          
          <!-- Visual hint -->
          <div v-if="currentStepData.visual" class="visual-hint">
            <component :is="currentStepData.visual" />
          </div>
          
          <!-- Actions -->
          <div class="tutorial-actions">
            <button 
              v-if="currentStep > 0" 
              @click="previousStep"
              class="btn-secondary"
            >
              Anterior
            </button>
            
            <button 
              v-if="currentStep < tutorialSteps.length - 1" 
              @click="nextStep"
              class="btn-primary"
            >
              Próximo
            </button>
            
            <button 
              v-else 
              @click="completeTutorial"
              class="btn-primary"
            >
              Começar a Jogar!
            </button>
            
            <button 
              @click="skipTutorial"
              class="btn-text"
            >
              Pular Tutorial
            </button>
          </div>
        </div>
        
        <!-- Highlight overlay -->
        <div 
          v-if="currentStepData.highlight"
          class="highlight-area"
          :style="highlightStyle"
        ></div>
        
        <!-- Arrow pointer -->
        <div 
          v-if="currentStepData.pointer"
          class="pointer-arrow"
          :style="pointerStyle"
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <path 
              d="M10,20 L30,20 M20,10 L30,20 L20,30" 
              stroke="currentColor" 
              stroke-width="3" 
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGamePreferencesStore } from '@/stores/gamePreferences.store';

interface TutorialStep {
  title: string;
  description: string;
  highlight?: { selector: string; padding?: number };
  pointer?: { x: number; y: number; angle: number };
  position?: { x: string; y: string };
  visual?: any;
}

const preferencesStore = useGamePreferencesStore();

const showTutorial = ref(false);
const currentStep = ref(0);
const isMobile = ref(false);

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Bem-vindo ao Mahjong Solitaire!',
    description: 'Aprenda a jogar este clássico jogo de peças chinesas. O objetivo é remover todas as peças do tabuleiro encontrando pares correspondentes.',
    position: { x: 'center', y: 'center' }
  },
  {
    title: 'Identificando Peças Livres',
    description: 'Apenas peças "livres" podem ser selecionadas. Uma peça está livre quando não tem peças em cima dela e tem pelo menos um lado (esquerdo ou direito) desbloqueado.',
    highlight: { selector: '.tile-free', padding: 10 },
    pointer: { x: 50, y: 50, angle: 45 }
  },
  {
    title: 'Fazendo Combinações',
    description: 'Clique em duas peças idênticas livres para removê-las. As peças devem ter exatamente o mesmo símbolo ou padrão.',
    highlight: { selector: '.tile-field', padding: 20 }
  },
  {
    title: 'Sistema de Pontuação',
    description: 'Ganhe pontos por cada par removido. Combos consecutivos e jogadas rápidas dão pontos extras!',
    highlight: { selector: '.status-bar', padding: 5 },
    pointer: { x: 200, y: 10, angle: -45 }
  },
  {
    title: 'Dicas e Desfazer',
    description: 'Use o botão de dica (H) quando estiver preso, ou desfaça (Ctrl+Z) movimentos errados. Mas use com sabedoria - eles afetam sua pontuação!',
    highlight: { selector: '.status-bar-controls', padding: 5 }
  },
  {
    title: 'Atalhos de Teclado',
    description: 'H - Dica | Ctrl+Z - Desfazer | Ctrl+Y - Refazer | P - Pausar | N - Novo Jogo | M - Som/Música',
    position: { x: 'center', y: 'center' }
  },
  {
    title: 'Pronto para Jogar!',
    description: 'Boa sorte! Lembre-se: paciência e estratégia são fundamentais. Nem sempre a primeira jogada óbvia é a melhor!',
    position: { x: 'center', y: 'center' }
  }
];

const currentStepData = computed(() => tutorialSteps[currentStep.value]);

const cardPosition = computed(() => {
  const step = currentStepData.value;
  if (!step.position) return {};
  
  const styles: any = {};
  
  if (step.position.x === 'center') {
    styles.left = '50%';
    styles.transform = 'translateX(-50%)';
  } else {
    styles.left = step.position.x;
  }
  
  if (step.position.y === 'center') {
    styles.top = '50%';
    styles.transform = (styles.transform || '') + ' translateY(-50%)';
  } else {
    styles.top = step.position.y;
  }
  
  return styles;
});

const highlightStyle = computed(() => {
  const highlight = currentStepData.value.highlight;
  if (!highlight) return {};
  
  const element = document.querySelector(highlight.selector);
  if (!element) return {};
  
  const rect = element.getBoundingClientRect();
  const padding = highlight.padding || 0;
  
  return {
    left: `${rect.left - padding}px`,
    top: `${rect.top - padding}px`,
    width: `${rect.width + padding * 2}px`,
    height: `${rect.height + padding * 2}px`
  };
});

const pointerStyle = computed(() => {
  const pointer = currentStepData.value.pointer;
  if (!pointer) return {};
  
  return {
    left: `${pointer.x}px`,
    top: `${pointer.y}px`,
    transform: `rotate(${pointer.angle}deg)`
  };
});

function checkIfFirstTime() {
  const hasPlayedBefore = localStorage.getItem('mahjong-tutorial-completed');
  if (!hasPlayedBefore) {
    showTutorial.value = true;
  }
}

function nextStep() {
  if (currentStep.value < tutorialSteps.length - 1) {
    currentStep.value++;
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function skipTutorial() {
  showTutorial.value = false;
  localStorage.setItem('mahjong-tutorial-completed', 'true');
}

function completeTutorial() {
  showTutorial.value = false;
  localStorage.setItem('mahjong-tutorial-completed', 'true');
  
  // Optionally trigger some celebration effect
  const event = new CustomEvent('tutorial-completed');
  window.dispatchEvent(event);
}

function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
}

onMounted(() => {
  checkIfFirstTime();
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999999;
  pointer-events: none;
}

.tutorial-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  pointer-events: auto;
}

.tutorial-content {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
  
  &.mobile {
    .tutorial-card {
      width: 90%;
      max-width: 400px;
    }
  }
}

.step-indicator {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  pointer-events: auto;
  z-index: 1000000;
  
  .step-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
    
    &.active {
      background: $primary;
      transform: scale(1.2);
    }
    
    &.completed {
      background: rgba(255, 255, 255, 0.7);
    }
  }
}

.tutorial-card {
  position: absolute;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  max-width: 480px;
  width: calc(100% - 40px);
  animation: slideIn 0.3s ease-out;
  
  h3 {
    margin: 0 0 12px 0;
    color: $primary;
    font-size: 1.5rem;
  }
  
  p {
    margin: 0 0 20px 0;
    color: #333;
    line-height: 1.6;
  }
}

.visual-hint {
  margin: 20px 0;
  padding: 20px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  text-align: center;
}

.tutorial-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
  
  button {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    
    &.btn-primary {
      background: $primary;
      color: white;
      
      &:hover {
        background: darken($primary, 10%);
        transform: translateY(-1px);
      }
    }
    
    &.btn-secondary {
      background: #f0f0f0;
      color: #333;
      
      &:hover {
        background: #e0e0e0;
      }
    }
    
    &.btn-text {
      background: transparent;
      color: #666;
      text-decoration: underline;
      
      &:hover {
        color: #333;
      }
    }
  }
}

.highlight-area {
  position: fixed;
  border: 3px solid $primary;
  border-radius: 8px;
  pointer-events: none;
  animation: pulse 2s infinite;
  box-shadow: 0 0 20px rgba($primary, 0.5);
}

.pointer-arrow {
  position: fixed;
  width: 40px;
  height: 40px;
  color: $primary;
  pointer-events: none;
  animation: bounce 1s infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

// Animations
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>