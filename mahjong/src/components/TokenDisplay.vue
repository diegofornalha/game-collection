<template>
  <div ref="tokenDisplayRef" :class="displayClasses">
    <div class="token-icon" ref="tokenIconRef">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
        <circle cx="12" cy="12" r="8" fill="currentColor"/>
        <path d="M12 6C12 6 14.5 8 14.5 12C14.5 16 12 18 12 18C12 18 9.5 16 9.5 12C9.5 8 12 6 12 6Z" fill="white" opacity="0.9"/>
        <circle cx="12" cy="12" r="2" fill="white"/>
      </svg>
    </div>
    
    <div class="token-amount">
      <AnimatedNumber
        :value="tokens"
        :duration="showAnimation ? 1000 : 0"
        :format="formatNumber"
      />
    </div>
    
    <Transition name="change">
      <div v-if="changeAmount !== 0" class="token-change" :class="changeClass">
        {{ changeAmount > 0 ? '+' : '' }}{{ formatNumber(changeAmount) }}
      </div>
    </Transition>
    
    <!-- Overlay de animação de partículas -->
    <TokenAnimationOverlay
      v-if="showParticleAnimation"
      :active="animationActive"
      :source-element="animationSource"
      :target-element="tokenIconRef"
      :particle-count="particleCount"
      :duration="animationDuration"
      @animation-complete="onAnimationComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import AnimatedNumber from './common/AnimatedNumber.vue'
import TokenAnimationOverlay from './animations/TokenAnimationOverlay.vue'

interface Props {
  tokens: number
  showAnimation?: boolean
  compact?: boolean
  showChange?: boolean
  showParticleAnimation?: boolean
  animationSource?: HTMLElement | null
}

const props = withDefaults(defineProps<Props>(), {
  tokens: 0,
  showAnimation: true,
  compact: false,
  showChange: true,
  showParticleAnimation: true,
  animationSource: null
})

const emit = defineEmits<{
  'tokens-changed': [oldValue: number, newValue: number]
}>()

// Refs para elementos DOM
const tokenDisplayRef = ref<HTMLDivElement>()
const tokenIconRef = ref<HTMLDivElement>()

const previousTokens = ref(props.tokens)
const changeAmount = ref(0)
const changeClass = ref('')

// Estados da animação de partículas
const animationActive = ref(false)
const particleCount = ref(20)
const animationDuration = ref(2000)

const displayClasses = computed(() => [
  'token-display',
  {
    'compact': props.compact,
    'animating': changeAmount.value !== 0 || animationActive.value,
    'particle-animating': animationActive.value
  }
])

// Detectar mudanças nos tokens
watch(() => props.tokens, (newValue, oldValue) => {
  if (props.showChange && oldValue !== undefined) {
    const diff = newValue - oldValue
    if (diff !== 0) {
      changeAmount.value = diff
      changeClass.value = diff > 0 ? 'positive' : 'negative'
      
      // Emitir evento de mudança
      emit('tokens-changed', oldValue, newValue)
      
      // Ativar animação de partículas se configurado e tokens aumentaram
      if (props.showParticleAnimation && diff > 0) {
        // Ajustar quantidade de partículas baseado no ganho
        particleCount.value = Math.min(30, Math.max(10, diff))
        animationDuration.value = diff >= 100 ? 2500 : 2000
        animationActive.value = true
      }
      
      // Limpar a animação após 2 segundos
      setTimeout(() => {
        changeAmount.value = 0
        changeClass.value = ''
      }, 2000)
    }
  }
  previousTokens.value = newValue
})

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString('pt-BR')
}

// Callback quando animação de partículas termina
function onAnimationComplete() {
  animationActive.value = false
}
</script>

<script lang="ts">
export default {
  name: 'TokenDisplay'
}
</script>

<style scoped>
.token-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
  position: relative;
  transition: all 0.3s;
}

.token-display:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

/* Ícone do token */
.token-icon {
  width: 24px;
  height: 24px;
  color: var(--yellow-500);
  animation: rotate 20s linear infinite;
}

.token-icon svg {
  width: 100%;
  height: 100%;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Quantidade de tokens */
.token-amount {
  font-weight: 600;
  font-size: 1.125rem;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

/* Indicador de mudança */
.token-change {
  position: absolute;
  top: -10px;
  right: -10px;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  animation: slideInFade 0.5s ease-out;
}

.token-change.positive {
  background: var(--green-100);
  color: var(--green-600);
  border: 1px solid var(--green-200);
}

.token-change.negative {
  background: var(--red-100);
  color: var(--red-600);
  border: 1px solid var(--red-200);
}

@keyframes slideInFade {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Transição de mudança */
.change-enter-active,
.change-leave-active {
  transition: all 0.3s;
}

.change-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.change-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Versão compacta */
.compact {
  padding: 0.375rem 0.75rem;
  gap: 0.375rem;
  background: transparent;
  border: none;
}

.compact:hover {
  transform: none;
  box-shadow: none;
}

.compact .token-icon {
  width: 20px;
  height: 20px;
}

.compact .token-amount {
  font-size: 1rem;
}

.compact .token-change {
  top: -8px;
  right: -8px;
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
}

/* Estado de animação */
.animating .token-icon {
  animation-duration: 2s;
}

.animating .token-amount {
  color: var(--yellow-600);
}

/* Estado de animação com partículas */
.particle-animating .token-icon {
  animation: pulse-glow 0.5s ease-out;
}

@keyframes pulse-glow {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
  50% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 8px var(--yellow-400));
  }
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
}

/* Responsivo */
@media (max-width: 480px) {
  .token-display:not(.compact) {
    padding: 0.375rem 0.75rem;
  }
  
  .token-amount {
    font-size: 1rem;
  }
}

/* Tema escuro */
@media (prefers-color-scheme: dark) {
  .token-display {
    background: var(--surface-color-dark);
    border-color: var(--border-color-dark);
  }
  
  .token-icon {
    color: var(--yellow-400);
  }
  
  .token-change.positive {
    background: var(--green-900);
    color: var(--green-400);
    border-color: var(--green-800);
  }
  
  .token-change.negative {
    background: var(--red-900);
    color: var(--red-400);
    border-color: var(--red-800);
  }
}
</style>