<template>
  <transition name="xp-float">
    <div v-if="visible" class="xp-display" :style="position">
      +{{ xpAmount }} XP
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Props {
  xpAmount: number;
  x?: number;
  y?: number;
}

const props = withDefaults(defineProps<Props>(), {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2
});

const visible = ref(false);
const position = ref({
  left: `${props.x}px`,
  top: `${props.y}px`
});

onMounted(() => {
  visible.value = true;
  
  // Hide after animation
  setTimeout(() => {
    visible.value = false;
  }, 2000);
});
</script>

<style scoped>
.xp-display {
  position: fixed;
  font-size: 24px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 10000;
  transform: translateX(-50%);
}

.xp-float-enter-active {
  animation: floatUp 2s ease-out;
}

.xp-float-leave-active {
  transition: opacity 0.3s ease;
}

.xp-float-leave-to {
  opacity: 0;
}

@keyframes floatUp {
  0% {
    transform: translateX(-50%) translateY(0) scale(0.5);
    opacity: 0;
  }
  20% {
    transform: translateX(-50%) translateY(-20px) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(-80px) scale(1);
    opacity: 0;
  }
}
</style>