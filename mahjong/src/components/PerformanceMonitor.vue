<template>
  <div 
    v-if="showMonitor" 
    class="performance-monitor"
    :class="{ 'mobile': isMobile }"
  >
    <div class="monitor-header">
      <h3>Performance Monitor</h3>
      <div class="grade" :class="gradeClass">{{ performanceGrade }}</div>
      <button @click="showMonitor = false" class="close-btn">×</button>
    </div>
    
    <div class="metrics-grid">
      <!-- FPS Metrics -->
      <div class="metric-card">
        <div class="metric-label">FPS</div>
        <div class="metric-value" :class="fpsClass">{{ metrics.fps }}</div>
        <div class="metric-sub">avg: {{ metrics.averageFps }}</div>
        <canvas ref="fpsGraph" width="120" height="40" class="mini-graph"></canvas>
      </div>
      
      <!-- Input Latency -->
      <div class="metric-card">
        <div class="metric-label">Input Latency</div>
        <div class="metric-value">{{ metrics.inputLatency.average.toFixed(1) }}ms</div>
        <div class="metric-sub">max: {{ metrics.inputLatency.max.toFixed(1) }}ms</div>
      </div>
      
      <!-- Memory Usage -->
      <div class="metric-card">
        <div class="metric-label">Memory</div>
        <div class="metric-value">{{ metrics.memory.used }}MB</div>
        <div class="metric-sub" :class="memoryTrendClass">
          {{ metrics.memory.trend }}
        </div>
      </div>
      
      <!-- Game Specific -->
      <div class="metric-card">
        <div class="metric-label">Tiles</div>
        <div class="metric-value">{{ metrics.renderingStats.visibleTiles }}</div>
        <div class="metric-sub">culled: {{ metrics.renderingStats.culledTiles }}</div>
      </div>
      
      <!-- Tile Operations -->
      <div class="metric-card">
        <div class="metric-label">Tile Ops/s</div>
        <div class="metric-value">{{ metrics.gameSpecific.tileOperationsPerSecond }}</div>
        <div class="metric-sub">performance: {{ metrics.gameSpecific.animationPerformance }}%</div>
      </div>
      
      <!-- Recovery Time -->
      <div class="metric-card" v-if="metrics.gameSpecific.lastRecoveryDuration > 0">
        <div class="metric-label">Recovery</div>
        <div class="metric-value">{{ metrics.gameSpecific.lastRecoveryDuration.toFixed(0) }}ms</div>
        <div class="metric-sub">tab switch</div>
      </div>
    </div>
    
    <!-- Optimization Suggestions -->
    <div v-if="suggestions.length > 0" class="suggestions">
      <div class="suggestions-header">Optimization Suggestions:</div>
      <div class="suggestion" v-for="suggestion in suggestions" :key="suggestion">
        • {{ suggestion }}
      </div>
    </div>
    
    <!-- Control Panel -->
    <div class="controls">
      <button @click="generateReport" class="control-btn">Generate Report</button>
      <button @click="clearMetrics" class="control-btn">Clear Metrics</button>
      <button @click="toggleAutoOptimization" class="control-btn" :class="{ active: autoOptimizationEnabled }">
        Auto Optimize
      </button>
    </div>
  </div>
  
  <!-- Toggle Button -->
  <button 
    v-if="!showMonitor && isDevelopment" 
    @click="showMonitor = true" 
    class="monitor-toggle"
    title="Show Performance Monitor"
  >
    📊
  </button>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useGamePerformance } from '@/composables/useGamePerformance';
import { useMobileUI } from '@/composables/useMobileUI';

const { isMobile } = useMobileUI();
const { 
  metrics, 
  performanceGrade, 
  suggestOptimizations,
  generateReport,
  config
} = useGamePerformance({
  enableProfiling: true,
  debugMode: true
});

const showMonitor = ref(false);
const autoOptimizationEnabled = ref(config.enableAutoOptimization);
const suggestions = ref<string[]>([]);
const fpsGraph = ref<HTMLCanvasElement>();

const isDevelopment = computed(() => process.env.NODE_ENV === 'development');

const gradeClass = computed(() => ({
  'grade-a': performanceGrade.value === 'A',
  'grade-b': performanceGrade.value === 'B', 
  'grade-c': performanceGrade.value === 'C',
  'grade-d': performanceGrade.value === 'D'
}));

const fpsClass = computed(() => ({
  'fps-good': metrics.value.fps >= 55,
  'fps-ok': metrics.value.fps >= 30 && metrics.value.fps < 55,
  'fps-bad': metrics.value.fps < 30
}));

const memoryTrendClass = computed(() => ({
  'trend-stable': metrics.value.memory.trend === 'stable',
  'trend-increasing': metrics.value.memory.trend === 'increasing',
  'trend-decreasing': metrics.value.memory.trend === 'decreasing'
}));

// FPS graph drawing
const fpsHistory: number[] = [];
const drawFpsGraph = () => {
  if (!fpsGraph.value) return;
  
  const canvas = fpsGraph.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  fpsHistory.push(metrics.value.fps);
  if (fpsHistory.length > 60) fpsHistory.shift();
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (fpsHistory.length < 2) return;
  
  ctx.strokeStyle = metrics.value.fps >= 55 ? '#4ade80' : 
                   metrics.value.fps >= 30 ? '#fbbf24' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  const maxFps = 60;
  const stepX = canvas.width / (fpsHistory.length - 1);
  
  fpsHistory.forEach((fps, index) => {
    const x = index * stepX;
    const y = canvas.height - (fps / maxFps) * canvas.height;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
};

// Update suggestions periodically
const updateSuggestions = () => {
  suggestions.value = suggestOptimizations();
};

const clearMetrics = () => {
  fpsHistory.length = 0;
  suggestions.value = [];
  // Reset metrics would need to be implemented in the composable
};

const toggleAutoOptimization = () => {
  autoOptimizationEnabled.value = !autoOptimizationEnabled.value;
  config.enableAutoOptimization = autoOptimizationEnabled.value;
};

// Watch for FPS changes to update graph
watch(() => metrics.value.fps, () => {
  nextTick(() => {
    drawFpsGraph();
  });
});

// Update suggestions every 5 seconds
let suggestionInterval: number;

onMounted(() => {
  suggestionInterval = setInterval(updateSuggestions, 5000);
});

onUnmounted(() => {
  if (suggestionInterval) {
    clearInterval(suggestionInterval);
  }
});

// Keyboard shortcut to toggle monitor
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 'p') {
    event.preventDefault();
    showMonitor.value = !showMonitor.value;
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
});
</script>

<style lang="scss" scoped>
.performance-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 380px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 12px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  z-index: 10000;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  &.mobile {
    width: calc(100vw - 40px);
    max-width: 360px;
    top: 10px;
    right: 10px;
    font-size: 11px;
  }
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: bold;
  }

  .grade {
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
    
    &.grade-a { background: #059669; }
    &.grade-b { background: #0891b2; }
    &.grade-c { background: #d97706; }
    &.grade-d { background: #dc2626; }
  }

  .close-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 18px;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;

  .mobile & {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
}

.metric-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .metric-label {
    font-size: 10px;
    opacity: 0.7;
    margin-bottom: 2px;
  }

  .metric-value {
    font-size: 16px;
    font-weight: bold;
    
    &.fps-good { color: #4ade80; }
    &.fps-ok { color: #fbbf24; }
    &.fps-bad { color: #ef4444; }
  }

  .metric-sub {
    font-size: 9px;
    opacity: 0.6;
    margin-top: 2px;
    
    &.trend-stable { color: #4ade80; }
    &.trend-increasing { color: #fbbf24; }
    &.trend-decreasing { color: #60a5fa; }
  }

  .mini-graph {
    margin-top: 4px;
    width: 100%;
    height: 30px;
    opacity: 0.8;
  }
}

.suggestions {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 12px;

  .suggestions-header {
    font-weight: bold;
    margin-bottom: 4px;
    color: #fbbf24;
  }

  .suggestion {
    font-size: 10px;
    margin: 2px 0;
    opacity: 0.9;
  }
}

.controls {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  .control-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 10px;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    &.active {
      background: rgba(34, 197, 94, 0.3);
      border-color: rgba(34, 197, 94, 0.5);
    }
  }
}

.monitor-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  font-size: 20px;
  z-index: 9999;
  backdrop-filter: blur(10px);
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
}

// Dark mode improvements
@media (prefers-color-scheme: dark) {
  .performance-monitor {
    background: rgba(10, 10, 10, 0.95);
    border-color: rgba(255, 255, 255, 0.15);
  }
}

// High contrast mode
@media (prefers-contrast: high) {
  .performance-monitor {
    background: black;
    border: 2px solid white;
    
    .metric-card {
      border-color: rgba(255, 255, 255, 0.5);
    }
  }
}
</style>