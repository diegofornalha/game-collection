<template>
  <span class="animated-number">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface Props {
  value: number
  duration?: number
  format?: (value: number) => string
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  duration: 1000,
  format: (v: number) => v.toString(),
  delay: 0
})

const displayValue = ref(props.format(props.value))
// const startValue = ref(props.value) // Not used
const currentValue = ref(props.value)

const animate = (to: number) => {
  if (props.duration === 0) {
    currentValue.value = to
    displayValue.value = props.format(to)
    return
  }

  const from = currentValue.value
  const diff = to - from
  const startTime = Date.now()
  
  const update = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    
    // Easing function (easeOutCubic)
    const eased = 1 - Math.pow(1 - progress, 3)
    
    currentValue.value = from + (diff * eased)
    displayValue.value = props.format(Math.round(currentValue.value))
    
    if (progress < 1) {
      requestAnimationFrame(update)
    } else {
      currentValue.value = to
      displayValue.value = props.format(to)
    }
  }
  
  if (props.delay > 0) {
    setTimeout(update, props.delay)
  } else {
    update()
  }
}

watch(() => props.value, (newValue) => {
  animate(newValue)
})

onMounted(() => {
  if (props.duration > 0) {
    currentValue.value = 0
    displayValue.value = props.format(0)
    animate(props.value)
  }
})
</script>

<style scoped>
.animated-number {
  font-variant-numeric: tabular-nums;
  display: inline-block;
}
</style>

<script lang="ts">
export default {
  name: 'AnimatedNumber'
}
</script>