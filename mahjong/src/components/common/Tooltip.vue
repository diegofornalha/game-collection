<template>
  <div class="tooltip-wrapper" @mouseenter="show" @mouseleave="hide">
    <slot name="trigger">
      <span class="tooltip-trigger">
        <i class="fas fa-info-circle"></i>
      </span>
    </slot>
    
    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="isVisible"
          ref="tooltipRef"
          class="tooltip"
          :class="[position, { 'has-arrow': showArrow }]"
          :style="tooltipStyle"
        >
          <div class="tooltip-content">
            <slot></slot>
          </div>
          <div v-if="showArrow" class="tooltip-arrow"></div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

interface Props {
  position?: 'top' | 'bottom' | 'left' | 'right'
  showArrow?: boolean
  delay?: number
  offset?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  showArrow: true,
  delay: 200,
  offset: 8
})

const isVisible = ref(false)
const tooltipRef = ref<HTMLElement>()
const triggerRect = ref<DOMRect>()
const showTimeout = ref<number>()
const hideTimeout = ref<number>()

const tooltipStyle = computed(() => {
  if (!triggerRect.value || !tooltipRef.value) return {}
  
  const rect = triggerRect.value
  const tooltip = tooltipRef.value
  const offset = props.offset
  
  let top = 0
  let left = 0
  
  switch (props.position) {
    case 'top':
      top = rect.top - tooltip.offsetHeight - offset
      left = rect.left + (rect.width - tooltip.offsetWidth) / 2
      break
    case 'bottom':
      top = rect.bottom + offset
      left = rect.left + (rect.width - tooltip.offsetWidth) / 2
      break
    case 'left':
      top = rect.top + (rect.height - tooltip.offsetHeight) / 2
      left = rect.left - tooltip.offsetWidth - offset
      break
    case 'right':
      top = rect.top + (rect.height - tooltip.offsetHeight) / 2
      left = rect.right + offset
      break
  }
  
  // Garantir que o tooltip não saia da tela
  const padding = 10
  const maxLeft = window.innerWidth - tooltip.offsetWidth - padding
  const maxTop = window.innerHeight - tooltip.offsetHeight - padding
  
  left = Math.max(padding, Math.min(left, maxLeft))
  top = Math.max(padding, Math.min(top, maxTop))
  
  return {
    top: `${top}px`,
    left: `${left}px`
  }
})

const show = async (event: MouseEvent) => {
  clearTimeout(hideTimeout.value)
  
  const trigger = event.currentTarget as HTMLElement
  triggerRect.value = trigger.getBoundingClientRect()
  
  showTimeout.value = window.setTimeout(() => {
    isVisible.value = true
    nextTick(() => {
      // Recalcular posição após renderizar
      if (tooltipRef.value) {
        triggerRect.value = trigger.getBoundingClientRect()
      }
    })
  }, props.delay)
}

const hide = () => {
  clearTimeout(showTimeout.value)
  
  hideTimeout.value = window.setTimeout(() => {
    isVisible.value = false
  }, 100)
}
</script>

<style scoped>
.tooltip-wrapper {
  display: inline-block;
  position: relative;
}

.tooltip-trigger {
  cursor: help;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
}

.tooltip-content {
  background: var(--tooltip-bg, rgba(0, 0, 0, 0.9));
  color: var(--tooltip-color, white);
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  line-height: 1.4;
  max-width: 250px;
  box-shadow: var(--shadow-lg);
}

/* Seta do tooltip */
.tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--tooltip-bg, rgba(0, 0, 0, 0.9));
  transform: rotate(45deg);
}

/* Posicionamento da seta */
.tooltip.top .tooltip-arrow {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}

.tooltip.bottom .tooltip-arrow {
  top: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}

.tooltip.left .tooltip-arrow {
  right: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

.tooltip.right .tooltip-arrow {
  left: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

/* Animações */
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

.tooltip-enter-from.top,
.tooltip-leave-to.top {
  transform: translateY(5px);
}

.tooltip-enter-from.bottom,
.tooltip-leave-to.bottom {
  transform: translateY(-5px);
}

.tooltip-enter-from.left,
.tooltip-leave-to.left {
  transform: translateX(5px);
}

.tooltip-enter-from.right,
.tooltip-leave-to.right {
  transform: translateX(-5px);
}

/* Tema escuro */
@media (prefers-color-scheme: dark) {
  .tooltip-content {
    background: var(--tooltip-bg-dark, rgba(255, 255, 255, 0.95));
    color: var(--tooltip-color-dark, var(--text-primary));
  }
  
  .tooltip-arrow {
    background: var(--tooltip-bg-dark, rgba(255, 255, 255, 0.95));
  }
}
</style>

<script lang="ts">
export default {
  name: 'Tooltip'
}
</script>