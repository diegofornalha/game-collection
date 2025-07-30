import { reactive, computed } from 'vue'

export interface TokenAnimationConfig {
  duration: number
  particles: number
  spread: number
  gravity: number
  colors: string[]
  startVelocity: { min: number; max: number }
  scale: { min: number; max: number }
  fadeOut: boolean
  mobileOptimized: boolean
}

export interface AnimationParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  scale: number
  opacity: number
  rotation: number
  color: string
  lifetime: number
}

export interface AnimationState {
  active: boolean
  particles: AnimationParticle[]
  startTime: number
  sourcePosition: { x: number; y: number } | null
  targetPosition: { x: number; y: number } | null
}

const DEFAULT_CONFIG: TokenAnimationConfig = {
  duration: 2000,
  particles: 15,
  spread: 100,
  gravity: 300,
  colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFB84D'],
  startVelocity: { min: 100, max: 300 },
  scale: { min: 0.5, max: 1.5 },
  fadeOut: true,
  mobileOptimized: false
}

export function useTokenAnimation(customConfig?: Partial<TokenAnimationConfig>) {
  const config = reactive<TokenAnimationConfig>({
    ...DEFAULT_CONFIG,
    ...customConfig
  })

  const animationState = reactive<AnimationState>({
    active: false,
    particles: [],
    startTime: 0,
    sourcePosition: null,
    targetPosition: null
  })

  const isAnimating = computed(() => animationState.active)
  const currentParticles = computed(() => animationState.particles)

  let animationFrameId: number | null = null
  let particleIdCounter = 0

  // Detectar se está em dispositivo móvel
  const isMobile = computed(() => {
    return window.innerWidth <= 768 || 'ontouchstart' in window
  })

  // Ajustar configuração para mobile
  const optimizedConfig = computed<TokenAnimationConfig>(() => {
    if (!isMobile.value || !config.mobileOptimized) {
      return config
    }

    return {
      ...config,
      particles: Math.floor(config.particles * 0.6), // Reduzir partículas em 40%
      duration: Math.floor(config.duration * 0.8) // Animação mais rápida
    }
  })

  function createParticle(originX: number, originY: number): AnimationParticle {
    const angle = Math.random() * Math.PI * 2
    const velocity = optimizedConfig.value.startVelocity.min + 
      Math.random() * (optimizedConfig.value.startVelocity.max - optimizedConfig.value.startVelocity.min)
    
    return {
      id: particleIdCounter++,
      x: originX,
      y: originY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 100, // Impulso inicial para cima
      scale: optimizedConfig.value.scale.min + 
        Math.random() * (optimizedConfig.value.scale.max - optimizedConfig.value.scale.min),
      opacity: 1,
      rotation: Math.random() * 360,
      color: optimizedConfig.value.colors[
        Math.floor(Math.random() * optimizedConfig.value.colors.length)
      ],
      lifetime: 0
    }
  }

  function updateParticles(deltaTime: number) {
    const normalizedDelta = deltaTime / 1000 // Converter para segundos

    animationState.particles = animationState.particles
      .map(particle => {
        // Atualizar física
        particle.vy += optimizedConfig.value.gravity * normalizedDelta
        particle.x += particle.vx * normalizedDelta
        particle.y += particle.vy * normalizedDelta
        particle.rotation += 180 * normalizedDelta
        particle.lifetime += deltaTime

        // Fade out
        if (optimizedConfig.value.fadeOut) {
          const progress = particle.lifetime / optimizedConfig.value.duration
          particle.opacity = Math.max(0, 1 - progress)
        }

        return particle
      })
      .filter(particle => {
        // Remover partículas que expiraram
        return particle.lifetime < optimizedConfig.value.duration && particle.opacity > 0
      })

    // Parar animação quando não houver mais partículas
    if (animationState.particles.length === 0) {
      stopAnimation()
    }
  }

  function animate(timestamp: number) {
    if (!animationState.active) return

    const deltaTime = timestamp - animationState.startTime
    animationState.startTime = timestamp

    // Limitar delta time para evitar saltos grandes
    const clampedDelta = Math.min(deltaTime, 50)
    
    updateParticles(clampedDelta)

    animationFrameId = requestAnimationFrame(animate)
  }

  function triggerAnimation(
    sourceElement?: HTMLElement | null,
    targetElement?: HTMLElement | null
  ) {
    if (animationState.active) return

    // Obter posições dos elementos
    if (sourceElement) {
      const rect = sourceElement.getBoundingClientRect()
      animationState.sourcePosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    } else {
      // Posição padrão no centro da tela
      animationState.sourcePosition = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      }
    }

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      animationState.targetPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    }

    // Criar partículas
    animationState.particles = Array.from(
      { length: optimizedConfig.value.particles },
      () => createParticle(
        animationState.sourcePosition!.x,
        animationState.sourcePosition!.y
      )
    )

    // Iniciar animação
    animationState.active = true
    animationState.startTime = performance.now()
    animationFrameId = requestAnimationFrame(animate)
  }

  function stopAnimation() {
    animationState.active = false
    animationState.particles = []
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  function updateConfig(newConfig: Partial<TokenAnimationConfig>) {
    Object.assign(config, newConfig)
  }

  // Cleanup ao desmontar
  function cleanup() {
    stopAnimation()
  }

  return {
    // Estado
    isAnimating,
    currentParticles,
    animationState,
    
    // Métodos
    triggerAnimation,
    stopAnimation,
    updateConfig,
    cleanup,
    
    // Configuração
    config: optimizedConfig
  }
}