<template>
  <div class="game-dialog-backdrop" @click="handleBackdropClick">
    <div class="game-dialog" :class="{ 'mobile': isMobile }" @click.stop>
      <div class="dialog-header" v-if="title">
        <h2 class="dialog-title">{{ title }}</h2>
      </div>
      
      <div class="dialog-content">
        <slot></slot>
      </div>
      
      <div class="dialog-actions" v-if="actions && actions.length > 0">
        <button
          v-for="(action, index) in actions"
          :key="index"
          class="dialog-button"
          :class="{
            'primary': action.primary,
            'secondary': !action.primary,
            'mobile-button': isMobile
          }"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMobileUI } from '@/composables/useMobileUI';

interface DialogAction {
  label: string;
  primary?: boolean;
  action?: () => void;
}

interface Props {
  title?: string;
  actions?: DialogAction[];
  closeOnBackdrop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closeOnBackdrop: true,
  actions: () => []
});

const emit = defineEmits<{
  close: [];
}>();

const { isMobile, vibrate } = useMobileUI();

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit('close');
  }
};

const handleAction = (action: DialogAction) => {
  if (isMobile.value) {
    vibrate(10);
  }
  
  if (action.action) {
    action.action();
  } else {
    emit('close');
  }
};
</script>

<style lang="scss" scoped>
.game-dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: backdrop-fade-in 0.3s ease-out;
  padding: 20px;
}

.game-dialog {
  background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  animation: dialog-slide-in 0.3s ease-out;
  
  &.mobile {
    max-width: 90vw;
    border-radius: 16px;
  }
}

.dialog-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialog-title {
  margin: 0;
  font-size: 24px;
  color: #ecf0f1;
  text-align: center;
  font-weight: 600;
  
  .mobile & {
    font-size: 20px;
  }
}

.dialog-content {
  padding: 20px;
  color: #ecf0f1;
  overflow-y: auto;
  max-height: 50vh;
  
  p {
    margin: 10px 0;
    line-height: 1.6;
  }
  
  .mobile & {
    padding: 16px;
    font-size: 14px;
  }
}

.dialog-actions {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  
  .mobile & {
    padding: 12px 16px;
    gap: 8px;
  }
}

.dialog-button {
  min-width: 120px;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.primary {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #2980b9, #21618c);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 10px rgba(52, 152, 219, 0.3);
    }
  }
  
  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #ecf0f1;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    &:active {
      background: rgba(255, 255, 255, 0.05);
    }
  }
  
  &.mobile-button {
    min-width: 100px;
    min-height: 44px;
    font-size: 14px;
    padding: 10px 20px;
  }
}

@keyframes backdrop-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes dialog-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Modo escuro
@media (prefers-color-scheme: dark) {
  .game-dialog {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }
  
  .dialog-button.secondary {
    background: rgba(255, 255, 255, 0.05);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>

<script lang="ts">
export default {
  name: 'GameDialog'
}
</script>