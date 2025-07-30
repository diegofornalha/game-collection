<template>
  <Teleport to="body">
    <div 
      v-if="isAnimating" 
      class="token-animation-overlay"
      :class="{ 'mobile-optimized': isMobile }"
      aria-hidden="true"
    >
      <TransitionGroup
        name="particle"
        tag="div"
        class="particles-container"
      >
        <div
          v-for="particle in currentParticles"
          :key="particle.id"
          class="particle"
          :style="getParticleStyle(particle)"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.8"/>
            <circle cx="12" cy="12" r="7" fill="white" opacity="0.3"/>
            <path 
              d="M12 4l2.5 5 5.5 0.8-4 3.9 0.9 5.3L12 16.5 7.1 19l0.9-5.3-4-3.9 5.5-0.8z" 
              fill="white" 
              opacity="0.9"
            />
          </svg>
        </div>
      </TransitionGroup>

      <!-- Efeito de brilho no ponto de destino -->
      <Transition name="glow">
        <div 
          v-if="showTargetGlow && animationState.targetPosition"
          class="target-glow"
          :style="{
            left: `${animationState.targetPosition.x}px`,
            top: `${animationState.targetPosition.y}px`
          }"
        />
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useTokenAnimation, type AnimationParticle } from '@/composables/useTokenAnimation'

interface Props {
  active?: boolean
  sourceElement?: HTMLElement | null
  targetElement?: HTMLElement | null
  mobileOptimized?: boolean
  showGlow?: boolean
  particleCount?: number
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  sourceElement: null,
  targetElement: null,
  mobileOptimized: true,
  showGlow: true,
  particleCount: 15,
  duration: 2000
})

const emit = defineEmits<{
  'animation-complete': []
}>()

// Detectar mobile
const isMobile = computed(() => {
  return window.innerWidth <= 768 || 'ontouchstart' in window
})

// Configurar animação
const {
  isAnimating,
  currentParticles,
  animationState,
  triggerAnimation,
  stopAnimation,
  cleanup
} = useTokenAnimation({
  particles: props.particleCount,
  duration: props.duration,
  mobileOptimized: props.mobileOptimized,
  spread: 120,
  gravity: 400,
  startVelocity: { min: 150, max: 350 },
  scale: { min: 0.6, max: 1.4 },
  fadeOut: true,
  colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFB84D', '#FFCC00']
})

const showTargetGlow = ref(false)

// Observar mudanças na propriedade active
watch(() => props.active, (newActive) => {
  if (newActive) {
    triggerAnimation(props.sourceElement, props.targetElement)
    
    // Mostrar brilho no destino se configurado
    if (props.showGlow && props.targetElement) {
      setTimeout(() => {
        showTargetGlow.value = true
      }, props.duration * 0.7)
      
      setTimeout(() => {
        showTargetGlow.value = false
      }, props.duration + 500)
    }
  } else {
    stopAnimation()
    showTargetGlow.value = false
  }
})

// Observar quando a animação termina
watch(isAnimating, (animating) => {
  if (!animating && props.active) {
    emit('animation-complete')
  }
})

// Função para obter o estilo de cada partícula
function getParticleStyle(particle: AnimationParticle) {
  return {
    transform: `translate(${particle.x}px, ${particle.y}px) 
                rotate(${particle.rotation}deg) 
                scale(${particle.scale})`,
    opacity: particle.opacity,
    color: particle.color,
    '--particle-x': `${particle.x}px`,
    '--particle-y': `${particle.y}px`
  }
}

// Cleanup ao desmontar
onUnmounted(() => {
  cleanup()
})
</script>

<script lang="ts">
export default {
  name: 'TokenAnimationOverlay'
}
</script>

<style scoped>
.token-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.particles-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  left: 0;
  top: 0;
  width: 24px;
  height: 24px;
  transform-origin: center;
  will-change: transform, opacity;
  filter: drop-shadow(0 0 4px currentColor);
}

/* Otimizações para mobile */
.mobile-optimized .particle {
  filter: drop-shadow(0 0 2px currentColor);
  will-change: auto;
}

.mobile-optimized .particle svg {
  width: 20px;
  height: 20px;
}

/* Efeito de brilho no destino */
.target-glow {
  position: absolute;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.4) 0%,
    rgba(255, 215, 0, 0.2) 40%,
    transparent 70%
  );
  border-radius: 50%;
  animation: pulse 0.8s ease-out;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

/* Transições das partículas */
.particle-enter-active {
  transition: none;
}

.particle-leave-active {
  transition: opacity 0.3s ease-out;
}

.particle-leave-to {
  opacity: 0;
}

/* Transição do brilho */
.glow-enter-active,
.glow-leave-active {
  transition: opacity 0.3s ease;
}

.glow-enter-from,
.glow-leave-to {
  opacity: 0;
}

/* Animação adicional para partículas especiais */
@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

.particle:nth-child(3n) {
  animation: sparkle 1s ease-in-out infinite;
}

/* Responsivo */
@media (max-width: 480px) {
  .particle {
    width: 20px;
    height: 20px;
  }
  
  .particle svg {
    width: 16px;
    height: 16px;
  }
  
  .target-glow {
    width: 40px;
    height: 40px;
  }
}

/* Reduzir movimento para preferências de acessibilidade */
@media (prefers-reduced-motion: reduce) {
  .particle {
    animation: none !important;
    transition: opacity 0.3s ease;
  }
  
  .target-glow {
    animation: none;
  }
}
</style>