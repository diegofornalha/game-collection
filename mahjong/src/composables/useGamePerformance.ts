import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
  droppedFrames: number;
  inputLatency: {
    average: number;
    min: number;
    max: number;
    samples: number[];
  };
  memory: {
    used: number;
    total: number;
    limit: number;
    trend: 'stable' | 'increasing' | 'decreasing';
  };
  renderingStats: {
    drawCalls: number;
    visibleTiles: number;
    culledTiles: number;
    memoizedComponents: number;
  };
  gameSpecific: {
    tileOperationsPerSecond: number;
    animationPerformance: number;
    tabSwitchRecoveryTime: number;
    lastRecoveryDuration: number;
  };
}

export interface PerformanceConfig {
  enableProfiling: boolean;
  fpsTarget: number;
  memoryThreshold: number;
  inputLatencyThreshold: number;
  enableAutoOptimization: boolean;
  debugMode: boolean;
}

/**
 * Sistema completo de monitoramento de performance para jogos Mahjong
 * Focado especificamente nos desafios de renderização de 144 tiles
 */
export function useGamePerformance(config: Partial<PerformanceConfig> = {}) {
  const defaultConfig: PerformanceConfig = {
    enableProfiling: process.env.NODE_ENV === 'development',
    fpsTarget: 60,
    memoryThreshold: 100, // MB
    inputLatencyThreshold: 16, // ms (60fps = 16.67ms per frame)
    enableAutoOptimization: true,
    debugMode: false,
    ...config
  };

  const metrics = ref<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    averageFps: 0,
    minFps: Infinity,
    maxFps: 0,
    droppedFrames: 0,
    inputLatency: { average: 0, min: Infinity, max: 0, samples: [] },
    memory: { used: 0, total: 0, limit: 0, trend: 'stable' },
    renderingStats: { drawCalls: 0, visibleTiles: 0, culledTiles: 0, memoizedComponents: 0 },
    gameSpecific: { tileOperationsPerSecond: 0, animationPerformance: 100, tabSwitchRecoveryTime: 0, lastRecoveryDuration: 0 }
  });

  // Performance monitoring state
  let frameCount = 0;
  let lastTime = performance.now();
  let fpsHistory: number[] = [];
  let memoryHistory: number[] = [];
  let animationId: number | null = null;
  let startTime = performance.now();
  let lastMemoryCheck = 0;
  let tileOperations = 0;
  let lastTileOperationTime = performance.now();

  // Input latency tracking
  let inputTimestamps = new Map<string, number>();
  const latencySamples: number[] = [];

  // Performance observers
  let performanceObserver: PerformanceObserver | null = null;

  // Críticos do jogo: detectar padrões de uso específicos do Mahjong
  const isGameSpecificScenario = computed(() => {
    return metrics.value.renderingStats.visibleTiles > 100; // Cenário crítico com muitas tiles
  });

  const performanceGrade = computed(() => {
    const { fps, inputLatency, memory } = metrics.value;
    
    if (fps >= defaultConfig.fpsTarget * 0.95 && inputLatency.average < defaultConfig.inputLatencyThreshold) {
      return 'A'; // Excelente
    } else if (fps >= defaultConfig.fpsTarget * 0.8 && inputLatency.average < defaultConfig.inputLatencyThreshold * 1.5) {
      return 'B'; // Bom
    } else if (fps >= defaultConfig.fpsTarget * 0.6) {
      return 'C'; // Aceitável
    } else {
      return 'D'; // Problemático
    }
  });

  /**
   * Monitoramento principal de frames - otimizado para jogos
   */
  const measureFrame = (currentTime: number) => {
    frameCount++;
    const deltaTime = currentTime - lastTime;
    
    // Atualiza métricas a cada segundo
    if (deltaTime >= 1000) {
      const currentFps = Math.round((frameCount * 1000) / deltaTime);
      
      metrics.value.fps = currentFps;
      metrics.value.frameTime = deltaTime / frameCount;
      
      // Histórico de FPS para análise de tendências
      fpsHistory.push(currentFps);
      if (fpsHistory.length > 60) fpsHistory.shift(); // Mantém 1 minuto de dados
      
      // Estatísticas
      metrics.value.averageFps = Math.round(
        fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length
      );
      metrics.value.minFps = Math.min(metrics.value.minFps, currentFps);
      metrics.value.maxFps = Math.max(metrics.value.maxFps, currentFps);
      
      // Detecta frames perdidos (crítico para jogos)
      if (currentFps < defaultConfig.fpsTarget * 0.9) {
        metrics.value.droppedFrames++;
        
        if (defaultConfig.enableAutoOptimization && currentFps < defaultConfig.fpsTarget * 0.7) {
          triggerAutoOptimization();
        }
      }
      
      // Monitoramento específico do jogo
      updateGameSpecificMetrics();
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    if (animationId) {
      animationId = requestAnimationFrame(measureFrame);
    }
  };

  /**
   * Monitoramento de memória avançado
   */
  const updateMemoryMetrics = () => {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
      const total = Math.round(performance.memory.totalJSHeapSize / 1048576);
      const limit = Math.round(performance.memory.jsHeapSizeLimit / 1048576);
      
      metrics.value.memory = { used, total, limit, trend: 'stable' };
      
      // Análise de tendência de memória
      memoryHistory.push(used);
      if (memoryHistory.length > 10) memoryHistory.shift();
      
      if (memoryHistory.length >= 3) {
        const recent = memoryHistory.slice(-3);
        const isIncreasing = recent.every((val, i) => i === 0 || val >= recent[i - 1]);
        const isDecreasing = recent.every((val, i) => i === 0 || val <= recent[i - 1]);
        
        metrics.value.memory.trend = isIncreasing ? 'increasing' : 
                                    isDecreasing ? 'decreasing' : 'stable';
      }
      
      // Alerta para vazamentos de memória
      if (used > defaultConfig.memoryThreshold) {
        console.warn(`[GamePerformance] Memory usage high: ${used}MB`);
        
        if (defaultConfig.enableAutoOptimization) {
          triggerMemoryOptimization();
        }
      }
    }
  };

  /**
   * Métricas específicas do jogo Mahjong
   */
  const updateGameSpecificMetrics = () => {
    const currentTime = performance.now();
    const timeDelta = currentTime - lastTileOperationTime;
    
    if (timeDelta > 0) {
      metrics.value.gameSpecific.tileOperationsPerSecond = 
        Math.round((tileOperations * 1000) / timeDelta);
    }
    
    // Reset para próximo período
    tileOperations = 0;
    lastTileOperationTime = currentTime;
    
    // Performance de animação baseada em FPS atual
    const fpsRatio = metrics.value.fps / defaultConfig.fpsTarget;
    metrics.value.gameSpecific.animationPerformance = Math.min(100, Math.round(fpsRatio * 100));
  };

  /**
   * Medição de latência de input específica para tiles
   */
  const measureInputLatency = (eventType: string = 'tile-click') => {
    const timestamp = performance.now();
    inputTimestamps.set(eventType, timestamp);
    
    return {
      startTime: timestamp,
      end: (callback?: () => void) => {
        const endTime = performance.now();
        const latency = endTime - timestamp;
        
        // Atualiza métricas de latência
        latencySamples.push(latency);
        if (latencySamples.length > 100) latencySamples.shift();
        
        const { inputLatency } = metrics.value;
        inputLatency.average = latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length;
        inputLatency.min = Math.min(inputLatency.min, latency);
        inputLatency.max = Math.max(inputLatency.max, latency);
        inputLatency.samples = [...latencySamples];
        
        if (callback) callback();
        
        // Log latência alta
        if (latency > defaultConfig.inputLatencyThreshold) {
          console.warn(`[GamePerformance] High input latency: ${latency.toFixed(2)}ms`);
        }
        
        return latency;
      }
    };
  };

  /**
   * Contador de operações de tiles (para métricas específicas do jogo)
   */
  const recordTileOperation = (type: 'click' | 'select' | 'match' | 'render') => {
    tileOperations++;
    
    if (defaultConfig.debugMode) {
      console.log(`[GamePerformance] Tile operation: ${type}`);
    }
  };

  /**
   * Monitoramento de renderização específico para tiles
   */
  const updateRenderingStats = (stats: Partial<typeof metrics.value.renderingStats>) => {
    Object.assign(metrics.value.renderingStats, stats);
    
    // Otimização automática baseada na renderização
    if (defaultConfig.enableAutoOptimization && stats.visibleTiles) {
      if (stats.visibleTiles > 120 && metrics.value.fps < defaultConfig.fpsTarget * 0.8) {
        suggestOptimizations();
      }
    }
  };

  /**
   * Monitoramento de recuperação de aba (específico para o jogo)
   */
  const measureTabRecovery = () => {
    const startTime = performance.now();
    
    return {
      complete: () => {
        const duration = performance.now() - startTime;
        metrics.value.gameSpecific.tabSwitchRecoveryTime = duration;
        metrics.value.gameSpecific.lastRecoveryDuration = duration;
        
        if (duration > 1000) {
          console.warn(`[GamePerformance] Slow tab recovery: ${duration.toFixed(2)}ms`);
        }
      }
    };
  };

  /**
   * Otimização automática para cenários críticos
   */
  const triggerAutoOptimization = () => {
    if (!defaultConfig.enableAutoOptimization) return;
    
    console.log('[GamePerformance] Triggering auto-optimization...');
    
    // Reduz qualidade de animações
    document.documentElement.style.setProperty('--animation-quality', '0.7');
    
    // Sugere usar v-memo mais agressivamente
    window.dispatchEvent(new CustomEvent('performance-optimization', {
      detail: { type: 'reduce-quality', fps: metrics.value.fps }
    }));
  };

  /**
   * Otimização de memória
   */
  const triggerMemoryOptimization = () => {
    console.log('[GamePerformance] Triggering memory optimization...');
    
    // Force garbage collection se disponível
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
    
    // Dispara evento para componentes limparem caches
    window.dispatchEvent(new CustomEvent('memory-pressure', {
      detail: { usage: metrics.value.memory.used }
    }));
  };

  /**
   * Sugestões de otimização baseadas em análise atual
   */
  const suggestOptimizations = () => {
    const suggestions = [];
    
    if (metrics.value.fps < defaultConfig.fpsTarget * 0.8) {
      suggestions.push('Considere usar v-memo em mais componentes de tiles');
      suggestions.push('Implemente viewport culling para tiles fora da tela');
    }
    
    if (metrics.value.inputLatency.average > defaultConfig.inputLatencyThreshold) {
      suggestions.push('Debounce cliques em tiles muito rápidos');
      suggestions.push('Use event delegation para tiles');
    }
    
    if (metrics.value.memory.trend === 'increasing') {
      suggestions.push('Verifique vazamentos de memória em event listeners');
      suggestions.push('Implemente object pooling para tiles');
    }
    
    if (suggestions.length > 0) {
      console.group('[GamePerformance] Optimization Suggestions:');
      suggestions.forEach(suggestion => console.log(`• ${suggestion}`));
      console.groupEnd();
    }
    
    return suggestions;
  };

  /**
   * Setup de observadores de performance nativos
   */
  const setupPerformanceObservers = () => {
    if ('PerformanceObserver' in window) {
      performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          if (entry.entryType === 'measure' && entry.name.startsWith('tile-')) {
            // Medições específicas de tiles
            recordTileOperation('render' as any);
          }
        }
      });
      
      try {
        performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (error) {
        console.warn('[GamePerformance] Performance observer not supported');
      }
    }
  };

  /**
   * Inicialização do sistema de monitoramento
   */
  const startMonitoring = () => {
    if (!defaultConfig.enableProfiling) return;
    
    console.log('[GamePerformance] Starting performance monitoring...');
    
    animationId = requestAnimationFrame(measureFrame);
    setupPerformanceObservers();
    
    // Monitora memória a cada 5 segundos
    const memoryInterval = setInterval(updateMemoryMetrics, 5000);
    
    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      clearInterval(memoryInterval);
      if (performanceObserver) {
        performanceObserver.disconnect();
      }
    };
  };

  /**
   * Relatório detalhado de performance
   */
  const generateReport = () => {
    const runtime = performance.now() - startTime;
    const reportData = {
      timestamp: new Date().toISOString(),
      runtime: `${(runtime / 1000).toFixed(2)}s`,
      grade: performanceGrade.value,
      metrics: { ...metrics.value },
      suggestions: suggestOptimizations(),
      gameContext: {
        isCriticalScenario: isGameSpecificScenario.value,
        tileCount: metrics.value.renderingStats.visibleTiles,
        memoryTrend: metrics.value.memory.trend
      }
    };
    
    if (defaultConfig.debugMode) {
      console.table(reportData.metrics);
    }
    
    return reportData;
  };

  // Lifecycle hooks
  let cleanupFn: (() => void) | null = null;

  onMounted(() => {
    cleanupFn = startMonitoring();
  });

  onUnmounted(() => {
    if (cleanupFn) {
      cleanupFn();
    }
  });

  // API pública
  return {
    // Métricas reativas
    metrics,
    performanceGrade,
    isGameSpecificScenario,
    
    // Controle
    startMonitoring,
    
    // Medições específicas do jogo
    measureInputLatency,
    recordTileOperation,
    updateRenderingStats,
    measureTabRecovery,
    
    // Análise e relatórios
    generateReport,
    suggestOptimizations,
    
    // Configuração
    config: defaultConfig
  };
}