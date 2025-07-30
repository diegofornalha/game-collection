# Análise de Performance Mobile - Mahjong

## Resumo Executivo
A versão mobile do jogo Mahjong apresenta boas práticas de otimização, mas existem oportunidades de melhorias para alcançar 60 FPS consistentes e reduzir o uso de memória.

## Pontos Positivos Identificados

### 1. Otimizações de Interface
- **Transições CSS otimizadas**: Animações de 0.2-0.3s são adequadas para mobile
- **Smooth scrolling**: Uso de `-webkit-overflow-scrolling: touch`
- **Safe areas**: Suporte completo para `safe-area-inset` (notch/home indicator)
- **Orientação responsiva**: Detecção e ajustes para landscape/portrait

### 2. Touch e Interação
- **Composable useMobileUI**: Implementação robusta com:
  - Haptic feedback via Vibration API
  - Auto-zoom inteligente
  - Expansão de área de toque (44px mínimo)
  - Detecção de gestos (pinch zoom)

### 3. Estrutura de Componentes
- **Separação clara**: MobileGameView.vue isolado para mobile
- **Menu slide-out**: Evita sobreposição e economiza espaço
- **Modal de pausa**: Interface limpa com backdrop blur

## Problemas de Performance Identificados

### 1. Renderização de Peças (TileField.vue)
- **Múltiplas camadas de DOM**: Cada peça tem 4 divs (bottom, side-bottom, side-left, face)
- **Gradientes complexos**: Múltiplos `linear-gradient` por peça
- **Sombras pesadas**: `box-shadow` com múltiplas camadas
- **Animações de partículas**: Dragon spirit hints com 6+ elementos animados

### 2. Uso de Memória
- **Sem object pooling**: Peças são criadas/destruídas sem reutilização
- **Animações não otimizadas**: Uso de propriedades que causam reflow
- **Falta de virtualização**: Todas as peças são renderizadas mesmo fora da viewport

### 3. Event Handling
- **Sem debounce/throttle**: Touch events podem disparar excessivamente
- **Falta de passive listeners**: Touch events não marcados como passive

## Sugestões de Otimização

### 1. Otimização de Renderização
```typescript
// Implementar renderização com transform3d para GPU acceleration
const getTileStyle = (tile: MjTile) => ({
  transform: `translate3d(${tile.x}px, ${tile.y}px, 0) scale(${scale})`,
  willChange: 'transform',
  contain: 'layout style paint'
});

// Simplificar estrutura DOM - usar pseudo-elementos
.tile {
  &::before { /* shadow */ }
  &::after { /* highlight */ }
}
```

### 2. Object Pooling para Peças
```typescript
class TilePool {
  private pool: HTMLElement[] = [];
  
  acquire(): HTMLElement {
    return this.pool.pop() || this.createTile();
  }
  
  release(tile: HTMLElement): void {
    this.resetTile(tile);
    this.pool.push(tile);
  }
}
```

### 3. Virtualização de Viewport
```typescript
const visibleTiles = computed(() => {
  const viewport = getViewportBounds();
  return tiles.value.filter(tile => 
    isInViewport(tile, viewport, BUFFER_ZONE)
  );
});
```

### 4. Otimização de Touch Events
```typescript
import { throttle } from 'lodash-es';

const handleTouchMove = throttle((e: TouchEvent) => {
  // Process touch
}, 16); // 60 FPS

element.addEventListener('touchmove', handleTouchMove, { passive: true });
```

### 5. Redução de Complexidade Visual
```scss
// Usar CSS containment
.tile {
  contain: layout style paint;
  
  // Simplificar gradientes
  background: linear-gradient(145deg, 
    var(--tile-color-1) 0%, 
    var(--tile-color-2) 100%
  );
  
  // Usar uma única sombra otimizada
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  
  // Desabilitar animações complexas em dispositivos fracos
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
  }
}
```

### 6. Implementação de FPS Monitor
```typescript
export function useFPSMonitor() {
  const fps = ref(0);
  let frameCount = 0;
  let lastTime = performance.now();
  
  const measureFrame = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTime + 1000) {
      fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime));
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFrame);
  };
  
  onMounted(() => measureFrame());
  
  return { fps };
}
```

### 7. Lazy Loading de Assets
```typescript
// Carregar sons sob demanda
const loadSound = async (soundName: string) => {
  if (!loadedSounds.has(soundName)) {
    const audio = await audioService.loadSingle(soundName);
    loadedSounds.set(soundName, audio);
  }
  return loadedSounds.get(soundName);
};
```

## Métricas de Performance Recomendadas

### Targets Mobile
- **FPS**: 60 FPS consistente (mínimo 55 FPS)
- **Frame Time**: < 16.67ms
- **Input Latency**: < 100ms
- **Memory Usage**: < 50MB
- **Initial Load**: < 3s em 3G

### Monitoramento
```typescript
const performanceMetrics = {
  fps: [],
  memory: [],
  inputLatency: [],
  
  report() {
    return {
      avgFPS: average(this.fps),
      p95FPS: percentile(this.fps, 0.95),
      avgMemory: average(this.memory),
      avgLatency: average(this.inputLatency)
    };
  }
};
```

## Implementação Prioritária

1. **Fase 1** (Impacto Alto, Esforço Baixo)
   - Adicionar passive listeners
   - Implementar throttle em touch events
   - Simplificar gradientes CSS

2. **Fase 2** (Impacto Alto, Esforço Médio)
   - Object pooling para peças
   - Reduzir complexidade de sombras
   - CSS containment

3. **Fase 3** (Impacto Médio, Esforço Alto)
   - Virtualização de viewport
   - Refatorar estrutura DOM das peças
   - Sistema de LOD (Level of Detail)

## Conclusão
O jogo já possui uma base sólida para mobile, mas pode se beneficiar significativamente das otimizações sugeridas, especialmente na renderização das peças e gestão de memória. A implementação gradual das melhorias garantirá uma experiência fluida mesmo em dispositivos mais modestos.