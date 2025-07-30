import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { useMobileUI } from '../useMobileUI';

// Mock do @vueuse/core
vi.mock('@vueuse/core', () => ({
  useWindowSize: vi.fn(() => ({
    width: ref(375),
    height: ref(667)
  })),
  useSwipe: vi.fn(),
  usePointerSwipe: vi.fn()
}));

// Mock do navigator.vibrate
global.navigator = {
  ...global.navigator,
  vibrate: vi.fn()
};

describe('useMobileUI', () => {
  let composable: ReturnType<typeof useMobileUI>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup DOM
    document.body.innerHTML = `
      <div class="game-board" style="width: 800px; height: 600px;"></div>
    `;
    
    composable = useMobileUI();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Device Detection', () => {
    it('deve detectar corretamente dispositivos mobile', () => {
      expect(composable.isMobile.value).toBe(true);
      expect(composable.isTablet.value).toBe(false);
    });

    it('deve detectar orientação portrait corretamente', () => {
      expect(composable.isPortrait.value).toBe(true);
    });

    it('deve detectar tablets corretamente', async () => {
      const { useWindowSize } = await import('@vueuse/core');
      (useWindowSize as any).mockReturnValue({
        width: ref(768),
        height: ref(1024)
      });
      
      const tabletComposable = useMobileUI();
      expect(tabletComposable.isTablet.value).toBe(true);
      expect(tabletComposable.isMobile.value).toBe(false);
    });
  });

  describe('UI Scaling', () => {
    it('deve calcular escala correta para diferentes tamanhos de tela', async () => {
      // iPhone SE
      expect(composable.uiScale.value).toBe(0.92);
      
      // iPhone 12
      const { useWindowSize } = await import('@vueuse/core');
      (useWindowSize as any).mockReturnValue({
        width: ref(390),
        height: ref(844)
      });
      
      const iphone12Composable = useMobileUI();
      expect(iphone12Composable.uiScale.value).toBe(0.92);
    });

    it('deve calcular tamanho de tile baseado na escala', () => {
      const baseSize = 40; // mobile base size
      const expectedSize = Math.max(baseSize * 0.92, 44); // min touch size
      expect(composable.tileSize.value).toBe(expectedSize);
    });
  });

  describe('Safe Area Insets', () => {
    it('deve configurar safe area insets corretamente', () => {
      const insets = composable.safeAreaInsets.value;
      expect(insets.top).toContain('safe-area-inset-top');
      expect(insets.bottom).toContain('safe-area-inset-bottom');
      expect(insets.left).toContain('safe-area-inset-left');
      expect(insets.right).toContain('safe-area-inset-right');
    });
  });

  describe('Haptic Feedback', () => {
    it('deve vibrar quando habilitado', () => {
      composable.vibrate(20);
      expect(navigator.vibrate).toHaveBeenCalledWith(20);
    });

    it('deve aceitar padrões de vibração', () => {
      composable.vibrate([100, 50, 100]);
      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);
    });

    it('não deve vibrar quando desabilitado', () => {
      const noHapticComposable = useMobileUI({ hapticFeedback: false });
      noHapticComposable.vibrate(20);
      expect(navigator.vibrate).not.toHaveBeenCalled();
    });
  });

  describe('Touch Target Enhancement', () => {
    it('deve expandir área de toque de elementos', () => {
      const element = document.createElement('div');
      composable.expandTouchTarget(element);
      
      expect(element.style.position).toBe('relative');
      expect(element.style.isolation).toBe('isolate');
      
      const hitArea = element.querySelector('div');
      expect(hitArea).toBeTruthy();
      expect(hitArea?.style.position).toBe('absolute');
      expect(hitArea?.style.top).toBe('-10px');
      expect(hitArea?.style.zIndex).toBe('1');
    });
  });

  describe('Touch Feedback', () => {
    it('deve adicionar feedback visual ao toque', () => {
      const element = document.createElement('div');
      composable.addTouchFeedback(element);
      
      const touchStartEvent = new Event('touchstart');
      element.dispatchEvent(touchStartEvent);
      
      expect(element.classList.contains('touch-active')).toBe(true);
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
      
      const touchEndEvent = new Event('touchend');
      element.dispatchEvent(touchEndEvent);
      
      expect(element.classList.contains('touch-active')).toBe(false);
    });
  });

  describe('Zoom Functionality', () => {
    it('deve iniciar com zoom level 1', () => {
      expect(composable.zoomLevel.value).toBe(1);
    });

    it('deve fazer auto-zoom em dispositivos mobile', async () => {
      vi.useFakeTimers();
      
      const mobileComposable = useMobileUI({ autoZoom: true });
      await nextTick();
      vi.advanceTimersByTime(150);
      
      // Auto zoom deveria ter sido chamado
      expect(mobileComposable.zoomLevel.value).not.toBe(1);
      
      vi.useRealTimers();
    });

    it('deve limitar zoom entre 0.5 e 3', () => {
      // Simular pinch zoom
      const touchEvent = new TouchEvent('touchmove', {
        touches: [
          { clientX: 100, clientY: 100 } as Touch,
          { clientX: 200, clientY: 200 } as Touch
        ] as any
      });
      
      document.dispatchEvent(touchEvent);
      
      // Verificar limites
      expect(composable.zoomLevel.value).toBeGreaterThanOrEqual(0.5);
      expect(composable.zoomLevel.value).toBeLessThanOrEqual(3);
    });
  });

  describe('Viewport Configuration', () => {
    it('deve configurar meta tag viewport corretamente', () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      expect(viewport).toBeTruthy();
      expect(viewport?.getAttribute('content')).toContain('viewport-fit=cover');
      expect(viewport?.getAttribute('content')).toContain('maximum-scale=3.0');
    });
  });

  describe('Mobile Styles', () => {
    it('deve gerar CSS variables corretas', () => {
      const styles = composable.mobileStyles.value;
      
      expect(styles['--ui-scale']).toBe(0.92);
      expect(styles['--tile-size']).toContain('px');
      expect(styles['--zoom-level']).toBe(1);
      expect(styles['--pan-x']).toBe('0px');
      expect(styles['--pan-y']).toBe('0px');
    });
  });

  describe('Gesture Support', () => {
    it('deve desabilitar gestos quando configurado', () => {
      const noGesturesComposable = useMobileUI({ gesturesEnabled: false });
      
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      
      // Montar novamente com gestos desabilitados
      noGesturesComposable.setViewportMeta();
      
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
        expect.any(Object)
      );
    });
  });
});