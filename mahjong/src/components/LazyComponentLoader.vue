<template>
  <div class="lazy-component-loader">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="hasError" class="error-container">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        Falha ao carregar componente
      </div>
      <button @click="retry" class="retry-button">
        Tentar Novamente
      </button>
    </div>
    
    <!-- Loaded component -->
    <component 
      v-else-if="loadedComponent" 
      :is="loadedComponent" 
      v-bind="componentProps"
      @[event]="$emit(event, $event)"
      v-for="event in componentEvents"
      :key="event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent, type Component } from 'vue';

interface Props {
  // Factory function que retorna Promise do componente
  componentFactory: () => Promise<any>;
  // Props para passar para o componente carregado
  componentProps?: Record<string, any>;
  // Eventos para escutar do componente
  componentEvents?: string[];
  // Texto de loading customizado
  loadingText?: string;
  // Delay antes de mostrar loading (evita flash)
  loadingDelay?: number;
  // Timeout para carregamento
  timeout?: number;
  // Se deve tentar carregar automaticamente
  autoLoad?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  componentProps: () => ({}),
  componentEvents: () => [],
  loadingText: 'Carregando...',
  loadingDelay: 200,
  timeout: 10000,
  autoLoad: true
});

const emit = defineEmits<{
  loaded: [component: Component];
  error: [error: Error];
  retry: [];
}>();

// Component state
const isLoading = ref(false);
const hasError = ref(false);
const loadedComponent = ref<Component | null>(null);
const loadingTimer = ref<number | null>(null);
const timeoutTimer = ref<number | null>(null);

// Load component with proper error handling
async function loadComponent() {
  if (loadedComponent.value) return; // Already loaded
  
  hasError.value = false;
  
  // Start loading after delay to prevent flash
  loadingTimer.value = window.setTimeout(() => {
    isLoading.value = true;
  }, props.loadingDelay);
  
  // Set timeout for loading
  timeoutTimer.value = window.setTimeout(() => {
    if (isLoading.value) {
      hasError.value = true;
      isLoading.value = false;
      const error = new Error(`Component loading timeout after ${props.timeout}ms`);
      emit('error', error);
    }
  }, props.timeout);
  
  try {
    // Use defineAsyncComponent for better error handling
    const asyncComponent = defineAsyncComponent({
      loader: props.componentFactory,
      delay: 0, // We handle delay ourselves
      timeout: props.timeout,
      errorComponent: {
        template: '<div class="component-error">Erro ao carregar</div>'
      },
      loadingComponent: {
        template: '<div class="component-loading">Carregando...</div>'
      }
    });
    
    // Resolve the component
    const component = await props.componentFactory();
    
    // Clear timers
    if (loadingTimer.value) {
      clearTimeout(loadingTimer.value);
      loadingTimer.value = null;
    }
    if (timeoutTimer.value) {
      clearTimeout(timeoutTimer.value);
      timeoutTimer.value = null;
    }
    
    // Set component
    loadedComponent.value = component.default || component;
    isLoading.value = false;
    
    emit('loaded', loadedComponent.value);
    
  } catch (error) {
    console.error('Failed to load component:', error);
    
    // Clear timers
    if (loadingTimer.value) {
      clearTimeout(loadingTimer.value);
      loadingTimer.value = null;
    }
    if (timeoutTimer.value) {
      clearTimeout(timeoutTimer.value);
      timeoutTimer.value = null;
    }
    
    hasError.value = true;
    isLoading.value = false;
    
    emit('error', error as Error);
  }
}

function retry() {
  hasError.value = false;
  loadedComponent.value = null;
  emit('retry');
  loadComponent();
}

// Auto-load on mount if enabled
onMounted(() => {
  if (props.autoLoad) {
    loadComponent();
  }
});

// Expose load method for manual loading
defineExpose({
  loadComponent,
  retry,
  isLoading: () => isLoading.value,
  hasError: () => hasError.value,
  isLoaded: () => !!loadedComponent.value
});
</script>

<style lang="scss" scoped>
.lazy-component-loader {
  width: 100%;
  height: 100%;
  position: relative;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

.loading-spinner {
  display: inline-block;
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
}

.spinner-ring {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 51px;
  height: 51px;
  margin: 6px;
  border: 6px solid;
  border-radius: 50%;
  animation: loading-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #FFD700 transparent transparent transparent;
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
}

@keyframes loading-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  text-align: center;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-text {
  color: #d32f2f;
  font-size: 1rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.retry-button {
  background: #FFD700;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #FFC107;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.component-error,
.component-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: #666;
  font-size: 0.9rem;
}
</style>