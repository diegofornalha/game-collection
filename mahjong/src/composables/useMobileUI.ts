import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWindowSize } from '@vueuse/core';

export interface MobileUIConfig {
  minTouchSize: number;
  hapticFeedback: boolean;
  gesturesEnabled: boolean;
  autoZoom: boolean;
}

export function useMobileUI(config: Partial<MobileUIConfig> = {}) {
  const defaultConfig: MobileUIConfig = {
    minTouchSize: 44,
    hapticFeedback: true,
    gesturesEnabled: true,
    autoZoom: true,
    ...config
  };

  const { width, height } = useWindowSize();
  const touchPoints = ref(new Map<number, Touch>());
  const zoomLevel = ref(1);
  const panOffset = ref({ x: 0, y: 0 });
  
  // Device detection
  const isMobile = computed(() => width.value < 768);
  const isTablet = computed(() => width.value >= 768 && width.value < 1024);
  const isPortrait = computed(() => height.value > width.value);
  
  // UI sizing based on screen
  const uiScale = computed(() => {
    if (width.value < 375) return 0.85; // Small phones
    if (width.value < 414) return 0.92; // Regular phones
    if (width.value < 768) return 1.0;   // Large phones
    return 1.1; // Tablets
  });
  
  // Safe areas for notch/home indicator
  const safeAreaInsets = computed(() => ({
    top: CSS.supports('top: env(safe-area-inset-top)') 
      ? 'env(safe-area-inset-top, 20px)' 
      : '20px',
    bottom: CSS.supports('bottom: env(safe-area-inset-bottom)') 
      ? 'env(safe-area-inset-bottom, 20px)' 
      : '20px',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)'
  }));
  
  // Haptic feedback
  const vibrate = (pattern: number | number[] = 10) => {
    if (!defaultConfig.hapticFeedback) return;
    
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
  
  // Touch-friendly tile size
  const tileSize = computed(() => {
    const baseSize = isMobile.value ? 40 : 50;
    return Math.max(baseSize * uiScale.value, defaultConfig.minTouchSize);
  });
  
  // Gesture handling
  const pinchZoom = (e: TouchEvent) => {
    if (!defaultConfig.gesturesEnabled || e.touches.length !== 2) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    if (!touchPoints.value.has(0) || !touchPoints.value.has(1)) {
      touchPoints.value.set(0, touch1);
      touchPoints.value.set(1, touch2);
      return;
    }
    
    const prevTouch1 = touchPoints.value.get(0)!;
    const prevTouch2 = touchPoints.value.get(1)!;
    
    const prevDistance = Math.hypot(
      prevTouch2.clientX - prevTouch1.clientX,
      prevTouch2.clientY - prevTouch1.clientY
    );
    
    const scale = currentDistance / prevDistance;
    zoomLevel.value = Math.max(0.5, Math.min(3, zoomLevel.value * scale));
    
    touchPoints.value.set(0, touch1);
    touchPoints.value.set(1, touch2);
  };
  
  // Auto-zoom for better mobile visibility
  const autoZoomToFit = () => {
    if (!defaultConfig.autoZoom || !isMobile.value) return;
    
    const gameBoard = document.querySelector('.game-board');
    if (!gameBoard) return;
    
    const boardRect = gameBoard.getBoundingClientRect();
    const viewportWidth = width.value * 0.9; // 90% of viewport
    const viewportHeight = height.value * 0.7; // 70% of viewport
    
    const scaleX = viewportWidth / boardRect.width;
    const scaleY = viewportHeight / boardRect.height;
    
    zoomLevel.value = Math.min(scaleX, scaleY);
  };
  
  // Enhanced touch target
  const expandTouchTarget = (element: HTMLElement) => {
    const expansion = 10; // pixels to expand
    
    element.style.position = 'relative';
    element.style.isolation = 'isolate';
    
    // Create invisible expanded hit area
    const hitArea = document.createElement('div');
    hitArea.style.position = 'absolute';
    hitArea.style.top = `-${expansion}px`;
    hitArea.style.left = `-${expansion}px`;
    hitArea.style.right = `-${expansion}px`;
    hitArea.style.bottom = `-${expansion}px`;
    hitArea.style.zIndex = '1';
    
    element.appendChild(hitArea);
  };
  
  // Touch feedback animation
  const addTouchFeedback = (element: HTMLElement) => {
    element.addEventListener('touchstart', () => {
      element.classList.add('touch-active');
      vibrate(10);
    });
    
    element.addEventListener('touchend', () => {
      element.classList.remove('touch-active');
    });
  };
  
  // Viewport meta tag adjustment
  const setViewportMeta = () => {
    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes, viewport-fit=cover'
    );
  };
  
  // CSS utilities
  const mobileStyles = computed(() => ({
    '--safe-area-top': safeAreaInsets.value.top,
    '--safe-area-bottom': safeAreaInsets.value.bottom,
    '--safe-area-left': safeAreaInsets.value.left,
    '--safe-area-right': safeAreaInsets.value.right,
    '--ui-scale': uiScale.value,
    '--tile-size': `${tileSize.value}px`,
    '--zoom-level': zoomLevel.value,
    '--pan-x': `${panOffset.value.x}px`,
    '--pan-y': `${panOffset.value.y}px`
  }));
  
  // Lifecycle
  onMounted(() => {
    setViewportMeta();
    
    if (defaultConfig.gesturesEnabled) {
      document.addEventListener('touchmove', pinchZoom, { passive: false });
    }
    
    // Auto zoom on mount if mobile
    if (isMobile.value) {
      setTimeout(autoZoomToFit, 100);
    }
  });
  
  onUnmounted(() => {
    if (defaultConfig.gesturesEnabled) {
      document.removeEventListener('touchmove', pinchZoom);
    }
  });
  
  return {
    // Device info
    isMobile,
    isTablet,
    isPortrait,
    width,
    height,
    
    // UI metrics
    uiScale,
    tileSize,
    safeAreaInsets,
    mobileStyles,
    
    // Zoom & Pan
    zoomLevel,
    panOffset,
    autoZoomToFit,
    
    // Touch enhancements
    expandTouchTarget,
    addTouchFeedback,
    vibrate,
    
    // Utilities
    setViewportMeta
  };
}