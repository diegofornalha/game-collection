# ViewContainer Component Specification

## Overview
The ViewContainer is the central component responsible for managing view transitions, lazy loading, and state preservation across navigation changes.

## Component Interface

```typescript
interface ViewContainerProps {
  preserveScroll?: boolean;      // Preserve scroll position on navigation
  transitionDuration?: number;    // Transition animation duration (ms)
  cacheViews?: boolean;          // Keep components in memory
  maxCachedViews?: number;       // Maximum cached views (default: 3)
}

interface ViewContainerEmits {
  'view-mounted': (view: ViewType) => void;
  'view-unmounted': (view: ViewType) => void;
  'transition-start': (from: ViewType, to: ViewType) => void;
  'transition-end': (from: ViewType, to: ViewType) => void;
  'load-error': (view: ViewType, error: Error) => void;
}
```

## Technical Implementation

### 1. Dynamic Component Loading

```typescript
// Lazy component map with error boundaries
const viewComponents = shallowRef<Record<ViewType, AsyncComponentLoader>>({
  home: defineAsyncComponent({
    loader: () => import('@/views/HomeView.vue'),
    loadingComponent: ViewLoadingState,
    errorComponent: ViewErrorState,
    delay: 200,
    timeout: 5000,
    onError(error, retry, fail) {
      console.error(`Failed to load view:`, error);
      emit('load-error', 'home', error);
      // Retry once on network errors
      if (error.message.includes('fetch')) {
        retry();
      } else {
        fail();
      }
    }
  }),
  // ... other views
});
```

### 2. Transition System

```typescript
// Transition state management
const transitionState = reactive({
  isTransitioning: false,
  fromView: null as ViewType | null,
  toView: null as ViewType | null,
  direction: 'forward' as TransitionDirection,
  startTime: 0
});

// Transition lifecycle
async function handleTransition(from: ViewType, to: ViewType) {
  transitionState.isTransitioning = true;
  transitionState.fromView = from;
  transitionState.toView = to;
  transitionState.startTime = performance.now();
  
  emit('transition-start', from, to);
  
  // Wait for transition
  await nextTick();
  await new Promise(resolve => 
    setTimeout(resolve, props.transitionDuration)
  );
  
  transitionState.isTransitioning = false;
  emit('transition-end', from, to);
}
```

### 3. View Caching Strategy

```typescript
// LRU cache for view instances
class ViewCache {
  private cache = new Map<ViewType, ComponentPublicInstance>();
  private accessOrder: ViewType[] = [];
  
  constructor(private maxSize: number) {}
  
  set(view: ViewType, instance: ComponentPublicInstance) {
    // Remove from access order if exists
    this.accessOrder = this.accessOrder.filter(v => v !== view);
    this.accessOrder.push(view);
    
    // Evict oldest if over limit
    if (this.accessOrder.length > this.maxSize) {
      const evicted = this.accessOrder.shift()!;
      this.cache.delete(evicted);
      instance.$unmount?.();
    }
    
    this.cache.set(view, instance);
  }
  
  get(view: ViewType): ComponentPublicInstance | undefined {
    const instance = this.cache.get(view);
    if (instance) {
      // Move to end (most recent)
      this.accessOrder = this.accessOrder.filter(v => v !== view);
      this.accessOrder.push(view);
    }
    return instance;
  }
  
  clear() {
    this.cache.forEach(instance => instance.$unmount?.());
    this.cache.clear();
    this.accessOrder = [];
  }
}
```

### 4. Scroll Preservation

```typescript
// Scroll position management
const scrollPositions = new Map<ViewType, number>();

function saveScrollPosition(view: ViewType) {
  if (!props.preserveScroll) return;
  
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  scrollPositions.set(view, scrollTop);
}

function restoreScrollPosition(view: ViewType) {
  if (!props.preserveScroll) return;
  
  const position = scrollPositions.get(view) || 0;
  
  // Use requestAnimationFrame for smooth restoration
  requestAnimationFrame(() => {
    window.scrollTo({
      top: position,
      behavior: 'instant' // Don't animate scroll restoration
    });
  });
}
```

### 5. Preloading Strategy

```typescript
// Intelligent preloading based on navigation patterns
const preloadQueue = new Set<ViewType>();

async function preloadView(view: ViewType) {
  if (preloadQueue.has(view)) return;
  
  preloadQueue.add(view);
  
  try {
    // Preload during idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        viewComponents.value[view]?.();
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without idle callback
      setTimeout(() => {
        viewComponents.value[view]?.();
      }, 100);
    }
  } catch (error) {
    console.warn(`Failed to preload view ${view}:`, error);
    preloadQueue.delete(view);
  }
}

// Preload adjacent views in navigation
watch(() => navigationStore.currentView, (newView) => {
  const navItems = navigationStore.navigationItems;
  const currentIndex = navItems.findIndex(item => item.id === newView);
  
  // Preload previous and next views
  if (currentIndex > 0) {
    preloadView(navItems[currentIndex - 1].id);
  }
  if (currentIndex < navItems.length - 1) {
    preloadView(navItems[currentIndex + 1].id);
  }
});
```

## CSS Architecture

### Base Styles
```scss
.view-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  
  // Mobile adjustments
  @include mobile {
    // Account for bottom navigation
    padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom));
  }
  
  // Desktop adjustments
  @include desktop {
    max-width: 1200px;
    margin: 0 auto;
  }
}

.view-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; // Smooth scrolling on iOS
  
  // Prevent layout shift during transitions
  &.transitioning {
    overflow: hidden;
  }
}
```

### Transition Classes
```scss
// Base transition
.view-transition-enter-active,
.view-transition-leave-active {
  transition: 
    transform var(--transition-duration) var(--ease-out),
    opacity var(--transition-duration) var(--ease-out);
  will-change: transform, opacity;
  
  // Hardware acceleration
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

// Forward navigation
.view-transition-forward-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.view-transition-forward-leave-to {
  transform: translateX(-30%);
  opacity: 0;
}

// Backward navigation
.view-transition-backward-enter-from {
  transform: translateX(-30%);
  opacity: 0;
}

.view-transition-backward-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

// Fade transition (for non-adjacent views)
.view-transition-fade-enter-from,
.view-transition-fade-leave-to {
  opacity: 0;
}

// Reduced motion support
@media (prefers-reduced-motion: reduce) {
  .view-transition-enter-active,
  .view-transition-leave-active {
    transition: opacity var(--transition-duration) ease;
    transform: none !important;
  }
}
```

## Loading States

```vue
<!-- ViewLoadingState.vue -->
<template>
  <div class="view-loading">
    <div class="loading-spinner" />
    <p class="loading-text">Carregando...</p>
  </div>
</template>

<style scoped lang="scss">
.view-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

## Error States

```vue
<!-- ViewErrorState.vue -->
<template>
  <div class="view-error">
    <div class="error-icon">⚠️</div>
    <h2>Erro ao carregar</h2>
    <p>{{ error?.message || 'Algo deu errado' }}</p>
    <button @click="retry" class="retry-button">
      Tentar Novamente
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error?: Error;
  retry?: () => void;
}

defineProps<Props>();
</script>
```

## Performance Metrics

### Memory Management
- Keep-alive for recently visited views (max 3)
- Automatic cleanup of unused components
- Efficient state preservation

### Loading Performance
- Lazy loading with code splitting
- Preloading of adjacent views
- Loading states with skeleton screens

### Animation Performance
- Hardware-accelerated transforms
- Will-change optimization
- Reduced motion support

## Accessibility Features

1. **Focus Management**
   - Restore focus to appropriate element after navigation
   - Announce view changes to screen readers

2. **Keyboard Navigation**
   - Support for browser back/forward buttons
   - Escape key to go back

3. **ARIA Attributes**
   - Live regions for view announcements
   - Proper role and label attributes

## Testing Considerations

```typescript
// Unit test example
describe('ViewContainer', () => {
  it('should cache views correctly', async () => {
    const wrapper = mount(ViewContainer, {
      props: { cacheViews: true, maxCachedViews: 2 }
    });
    
    // Navigate to multiple views
    await navigationStore.navigateTo('home');
    await navigationStore.navigateTo('profile');
    await navigationStore.navigateTo('settings');
    
    // Check cache size
    expect(wrapper.vm.viewCache.size).toBe(2);
    
    // Verify oldest view was evicted
    expect(wrapper.vm.viewCache.has('home')).toBe(false);
  });
});
```