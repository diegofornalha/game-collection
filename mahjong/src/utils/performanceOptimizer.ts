import { nextTick } from 'vue';

/**
 * Otimizações específicas de performance para o jogo Mahjong
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private optimizationLevel = 0; // 0 = normal, 1 = light, 2 = aggressive
  private tilePool: HTMLElement[] = [];
  private renderQueue: Array<() => void> = [];
  private isProcessingQueue = false;

  static getInstance(): PerformanceOptimizer {
    if (!this.instance) {
      this.instance = new PerformanceOptimizer();
    }
    return this.instance;
  }

  /**
   * Object pooling para elementos DOM de tiles
   */
  createTilePool(initialSize = 20): void {
    for (let i = 0; i < initialSize; i++) {
      const tileElement = this.createOptimizedTileElement();
      this.tilePool.push(tileElement);
    }
    console.log(`[PerformanceOptimizer] Tile pool initialized with ${initialSize} elements`);
  }

  private createOptimizedTileElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'tile';
    
    // Pre-configure for performance
    element.style.willChange = 'transform';
    element.style.backfaceVisibility = 'hidden';
    element.style.transform = 'translateZ(0)'; // Force GPU layer
    
    return element;
  }

  /**
   * Reutilizar elementos do pool
   */
  acquireTileElement(): HTMLElement {
    if (this.tilePool.length > 0) {
      return this.tilePool.pop()!;
    }
    return this.createOptimizedTileElement();
  }

  /**
   * Retornar elemento para o pool
   */
  releaseTileElement(element: HTMLElement): void {
    // Reset properties
    element.style.transform = 'translateZ(0)';
    element.className = 'tile';
    element.innerHTML = '';
    
    this.tilePool.push(element);
  }

  /**
   * Viewport culling - só renderiza tiles visíveis
   */
  isElementInViewport(element: HTMLElement, margin = 50): boolean {
    const rect = element.getBoundingClientRect();
    const viewport = {
      top: -margin,
      left: -margin,
      bottom: window.innerHeight + margin,
      right: window.innerWidth + margin
    };

    return (
      rect.bottom >= viewport.top &&
      rect.top <= viewport.bottom &&
      rect.right >= viewport.left &&
      rect.left <= viewport.right
    );
  }

  /**
   * Batching de operações DOM
   */
  batchDOMUpdates(updates: Array<() => void>): void {
    this.renderQueue.push(...updates);
    
    if (!this.isProcessingQueue) {
      this.processRenderQueue();
    }
  }

  private async processRenderQueue(): Promise<void> {
    this.isProcessingQueue = true;
    
    await nextTick();
    
    // Process all queued updates in a single frame
    requestAnimationFrame(() => {
      const updates = [...this.renderQueue];
      this.renderQueue = [];
      
      // Group similar operations
      const transforms: Array<() => void> = [];
      const classChanges: Array<() => void> = [];
      const others: Array<() => void> = [];
      
      updates.forEach(update => {
        const updateStr = update.toString();
        if (updateStr.includes('transform') || updateStr.includes('translate')) {
          transforms.push(update);
        } else if (updateStr.includes('class') || updateStr.includes('Class')) {
          classChanges.push(update);
        } else {
          others.push(update);
        }
      });
      
      // Execute grouped operations
      transforms.forEach(update => update());
      classChanges.forEach(update => update());
      others.forEach(update => update());
      
      this.isProcessingQueue = false;
    });
  }

  /**
   * Otimização automática baseada na performance atual
   */
  adaptPerformance(fps: number, memoryUsage: number): void {
    const targetFPS = 60;
    const memoryThreshold = 100; // MB
    
    let newLevel = 0;
    
    if (fps < targetFPS * 0.6 || memoryUsage > memoryThreshold * 1.5) {
      newLevel = 2; // Aggressive optimization
    } else if (fps < targetFPS * 0.8 || memoryUsage > memoryThreshold) {
      newLevel = 1; // Light optimization
    }
    
    if (newLevel !== this.optimizationLevel) {
      this.setOptimizationLevel(newLevel);
    }
  }

  private setOptimizationLevel(level: number): void {
    this.optimizationLevel = level;
    
    const root = document.documentElement;
    
    switch (level) {
      case 0: // Normal
        root.style.setProperty('--animation-duration', '0.3s');
        root.style.setProperty('--tile-shadow-blur', '8px');
        root.style.setProperty('--particle-count', '6');
        break;
        
      case 1: // Light optimization
        root.style.setProperty('--animation-duration', '0.2s');
        root.style.setProperty('--tile-shadow-blur', '4px');
        root.style.setProperty('--particle-count', '3');
        break;
        
      case 2: // Aggressive optimization
        root.style.setProperty('--animation-duration', '0.1s');
        root.style.setProperty('--tile-shadow-blur', '2px');
        root.style.setProperty('--particle-count', '0');
        
        // Disable non-essential animations
        root.classList.add('performance-mode');
        break;
    }
    
    console.log(`[PerformanceOptimizer] Optimization level set to ${level}`);
  }

  /**
   * Debounce para inputs muito rápidos
   */
  debounceInput<T extends any[]>(
    func: (...args: T) => void,
    wait: number
  ): (...args: T) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: T) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle para eventos que disparam muito frequentemente
   */
  throttleInput<T extends any[]>(
    func: (...args: T) => void,
    limit: number
  ): (...args: T) => void {
    let inThrottle: boolean;
    
    return (...args: T) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Lazy loading para components não críticos
   */
  createIntersectionObserver(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };
    
    return new IntersectionObserver(callback, options);
  }

  /**
   * Cleanup de recursos não utilizados
   */
  cleanup(): void {
    // Clear pools
    this.tilePool = [];
    this.renderQueue = [];
    
    // Remove performance classes
    document.documentElement.classList.remove('performance-mode');
    
    // Reset CSS variables
    const root = document.documentElement;
    root.style.removeProperty('--animation-duration');
    root.style.removeProperty('--tile-shadow-blur');
    root.style.removeProperty('--particle-count');
  }

  /**
   * Force garbage collection (se disponível)
   */
  forceGarbageCollection(): void {
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
      console.log('[PerformanceOptimizer] Forced garbage collection');
    }
  }

  /**
   * Otimizações específicas para mobile
   */
  optimizeForMobile(): void {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // Reduce tile count if needed
      this.setOptimizationLevel(1);
      
      // Optimize touch interactions
      document.body.style.touchAction = 'manipulation';
      
      // Reduce motion for better battery life
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.setOptimizationLevel(2);
      }
      
      console.log('[PerformanceOptimizer] Mobile optimizations applied');
    }
  }

  /**
   * Análise de performance em tempo real
   */
  startPerformanceAnalysis(): () => void {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measure = (currentTime: number) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Auto-adjust performance based on FPS
        if (window.performance?.memory) {
          const memoryMB = window.performance.memory.usedJSHeapSize / 1048576;
          this.adaptPerformance(fps, memoryMB);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measure);
    };

    animationId = requestAnimationFrame(measure);

    // Return cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();