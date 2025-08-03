import { defineAsyncComponent, Component } from 'vue';

// Loading component
const LoadingComponent = {
  template: `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando...</p>
    </div>
  `
};

// Error component
const ErrorComponent = {
  template: `
    <div class="error-container">
      <p>Erro ao carregar o componente.</p>
      <button @click="$emit('retry')">Tentar Novamente</button>
    </div>
  `
};

export function useLazyComponent(
  loader: () => Promise<Component>,
  options?: {
    delay?: number;
    timeout?: number;
    onError?: (error: Error) => void;
  }
) {
  return defineAsyncComponent({
    loader,
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    delay: options?.delay ?? 200,
    timeout: options?.timeout ?? 10000,
    onError(error: Error) {
      console.error('Error loading component:', error);
      options?.onError?.(error);
    }
  });
}