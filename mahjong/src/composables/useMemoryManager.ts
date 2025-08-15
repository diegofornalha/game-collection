import { onUnmounted, ref } from 'vue';

export interface ManagedTimer {
  id: number;
  type: 'timeout' | 'interval';
  cleanup: () => void;
}

export interface ManagedListener {
  target: EventTarget;
  event: string;
  handler: EventListener;
  options?: boolean | AddEventListenerOptions;
}

export function useMemoryManager() {
  const timers = ref<ManagedTimer[]>([]);
  const listeners = ref<ManagedListener[]>([]);
  const animationFrames = ref<number[]>([]);
  const intersectionObservers = ref<IntersectionObserver[]>([]);
  const resizeObservers = ref<ResizeObserver[]>([]);
  
  // Timer management
  function createTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      callback();
      // Auto-remove from tracking
      removeTimer(id);
    }, delay);
    
    const timer: ManagedTimer = {
      id,
      type: 'timeout',
      cleanup: () => clearTimeout(id)
    };
    
    timers.value.push(timer);
    return id;
  }
  
  function createInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(callback, delay);
    
    const timer: ManagedTimer = {
      id,
      type: 'interval',
      cleanup: () => clearInterval(id)
    };
    
    timers.value.push(timer);
    return id;
  }
  
  function removeTimer(id: number) {
    const index = timers.value.findIndex(timer => timer.id === id);
    if (index !== -1) {
      timers.value[index].cleanup();
      timers.value.splice(index, 1);
    }
  }
  
  function clearAllTimers() {
    timers.value.forEach(timer => timer.cleanup());
    timers.value = [];
  }
  
  // Event listener management
  function addEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) {
    target.addEventListener(event, handler, options);
    
    listeners.value.push({
      target,
      event,
      handler,
      options
    });
  }
  
  function removeEventListener(
    target: EventTarget,
    event: string,
    handler: EventListener
  ) {
    const index = listeners.value.findIndex(
      listener => 
        listener.target === target && 
        listener.event === event && 
        listener.handler === handler
    );
    
    if (index !== -1) {
      target.removeEventListener(event, handler);
      listeners.value.splice(index, 1);
    }
  }
  
  function clearAllEventListeners() {
    listeners.value.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    listeners.value = [];
  }
  
  // Animation frame management
  function requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = window.requestAnimationFrame((time) => {
      callback(time);
      // Auto-remove from tracking
      removeAnimationFrame(id);
    });
    
    animationFrames.value.push(id);
    return id;
  }
  
  function removeAnimationFrame(id: number) {
    const index = animationFrames.value.indexOf(id);
    if (index !== -1) {
      window.cancelAnimationFrame(id);
      animationFrames.value.splice(index, 1);
    }
  }
  
  function clearAllAnimationFrames() {
    animationFrames.value.forEach(id => window.cancelAnimationFrame(id));
    animationFrames.value = [];
  }
  
  // Observer management
  function createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observer = new IntersectionObserver(callback, options);
    intersectionObservers.value.push(observer);
    return observer;
  }
  
  function createResizeObserver(
    callback: ResizeObserverCallback
  ): ResizeObserver {
    const observer = new ResizeObserver(callback);
    resizeObservers.value.push(observer);
    return observer;
  }
  
  function clearAllObservers() {
    intersectionObservers.value.forEach(observer => observer.disconnect());
    resizeObservers.value.forEach(observer => observer.disconnect());
    intersectionObservers.value = [];
    resizeObservers.value = [];
  }
  
  // Debounce helper with memory management
  function createDebouncedFunction<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T {
    let timeoutId: number | null = null;
    
    const debouncedFn = ((...args: Parameters<T>) => {
      if (timeoutId !== null) {
        removeTimer(timeoutId);
      }
      
      timeoutId = createTimeout(() => {
        func(...args);
        timeoutId = null;
      }, wait);
    }) as T;
    
    return debouncedFn;
  }
  
  // Throttle helper with memory management
  function createThrottledFunction<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T {
    let timeoutId: number | null = null;
    let lastExecTime = 0;
    
    const throttledFn = ((...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > wait) {
        func(...args);
        lastExecTime = currentTime;
      } else if (timeoutId === null) {
        timeoutId = createTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
          timeoutId = null;
        }, wait - (currentTime - lastExecTime));
      }
    }) as T;
    
    return throttledFn;
  }
  
  // Memory leak detection
  function getMemoryUsage() {
    return {
      timers: timers.value.length,
      listeners: listeners.value.length,
      animationFrames: animationFrames.value.length,
      intersectionObservers: intersectionObservers.value.length,
      resizeObservers: resizeObservers.value.length
    };
  }
  
  function logMemoryUsage() {
    const usage = getMemoryUsage();
    console.log('[MemoryManager] Current usage:', usage);
    
    if (usage.timers > 10) {
      console.warn('[MemoryManager] High timer count detected:', usage.timers);
    }
    
    if (usage.listeners > 20) {
      console.warn('[MemoryManager] High listener count detected:', usage.listeners);
    }
  }
  
  // Cleanup all resources
  function cleanup() {
    clearAllTimers();
    clearAllEventListeners();
    clearAllAnimationFrames();
    clearAllObservers();
  }
  
  // Auto-cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });
  
  return {
    // Timer methods
    createTimeout,
    createInterval,
    removeTimer,
    clearAllTimers,
    
    // Event listener methods
    addEventListener,
    removeEventListener,
    clearAllEventListeners,
    
    // Animation frame methods
    requestAnimationFrame,
    removeAnimationFrame,
    clearAllAnimationFrames,
    
    // Observer methods
    createIntersectionObserver,
    createResizeObserver,
    clearAllObservers,
    
    // Helper methods
    createDebouncedFunction,
    createThrottledFunction,
    
    // Memory monitoring
    getMemoryUsage,
    logMemoryUsage,
    cleanup
  };
}