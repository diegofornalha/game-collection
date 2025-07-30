import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MobileTile from '../MobileTile.vue';
// import { MjTile } from '../../models/tile.model';

// Mock do navigator.vibrate
(global as any).navigator = {
  ...(global as any).navigator,
  vibrate: vi.fn()
};

describe('MobileTile', () => {
  let wrapper: any;
  let mockTile: any;

  beforeEach(() => {
    mockTile = {
      id: 1,
      type: 'bamboo',
      value: 3,
      x: 100,
      y: 100,
      z: 0,
      isBlocked: false,
      isSelected: false,
      isHinted: false
    };

    wrapper = mount(MobileTile, {
      props: {
        tile: mockTile,
        isMobile: true
      }
    });
  });

  describe('Touch Areas', () => {
    it('deve ter área de toque expandida', () => {
      const touchArea = wrapper.find('.touch-area');
      expect(touchArea.exists()).toBe(true);
      
      const tileElement = wrapper.find('.tile');
      const touchElement = touchArea.element as HTMLElement;
      const tileRect = tileElement.element.getBoundingClientRect();
      const touchRect = touchElement.getBoundingClientRect();
      
      // Touch area deve ser maior que o tile visual
      expect(touchRect.width).toBeGreaterThan(tileRect.width);
      expect(touchRect.height).toBeGreaterThan(tileRect.height);
    });

    it('deve ter tamanho mínimo de 44px para área de toque', () => {
      const touchArea = wrapper.find('.touch-area');
      const rect = touchArea.element.getBoundingClientRect();
      
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Touch Feedback', () => {
    it('deve aplicar feedback visual ao toque', async () => {
      const tile = wrapper.find('.tile');
      
      await tile.trigger('touchstart');
      expect(tile.classes()).toContain('touch-active');
      
      await tile.trigger('touchend');
      expect(tile.classes()).not.toContain('touch-active');
    });

    it('deve vibrar ao tocar em tiles válidos', async () => {
      await wrapper.setProps({ tile: { ...mockTile, isBlocked: false } });
      
      const tile = wrapper.find('.tile');
      await tile.trigger('touchstart');
      
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });

    it('não deve vibrar ao tocar em tiles bloqueados', async () => {
      await wrapper.setProps({ tile: { ...mockTile, isBlocked: true } });
      
      vi.clearAllMocks();
      const tile = wrapper.find('.tile');
      await tile.trigger('touchstart');
      
      expect(navigator.vibrate).not.toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    it('deve mostrar estado selecionado', async () => {
      await wrapper.setProps({ tile: { ...mockTile, isSelected: true } });
      
      const tile = wrapper.find('.tile');
      expect(tile.classes()).toContain('selected');
      expect(tile.find('.selection-glow').exists()).toBe(true);
    });

    it('deve mostrar estado de dica', async () => {
      await wrapper.setProps({ tile: { ...mockTile, isHinted: true } });
      
      const tile = wrapper.find('.tile');
      expect(tile.classes()).toContain('hinted');
      expect(tile.find('.hint-pulse').exists()).toBe(true);
    });

    it('deve mostrar estado bloqueado', async () => {
      await wrapper.setProps({ tile: { ...mockTile, isBlocked: true } });
      
      const tile = wrapper.find('.tile');
      expect(tile.classes()).toContain('blocked');
      expect(tile.attributes('aria-disabled')).toBe('true');
    });
  });

  describe('Touch Gestures', () => {
    it('deve emitir evento de seleção ao tap', async () => {
      const tile = wrapper.find('.tile');
      await tile.trigger('click');
      
      expect(wrapper.emitted('select')).toBeTruthy();
      expect(wrapper.emitted('select')[0]).toEqual([mockTile]);
    });

    it('deve mostrar preview ao long press', async () => {
      const tile = wrapper.find('.tile');
      
      // Simular long press
      await tile.trigger('touchstart');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(wrapper.find('.tile-preview').exists()).toBe(true);
      
      await tile.trigger('touchend');
      expect(wrapper.find('.tile-preview').exists()).toBe(false);
    });

    it('deve cancelar seleção se mover o dedo', async () => {
      const tile = wrapper.find('.tile');
      
      await tile.trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] });
      await tile.trigger('touchmove', { touches: [{ clientX: 150, clientY: 150 }] });
      await tile.trigger('touchend');
      
      expect(wrapper.emitted('select')).toBeFalsy();
    });
  });

  describe('Animações', () => {
    it('deve ter animação de entrada', () => {
      const tile = wrapper.find('.tile');
      expect(tile.classes()).toContain('tile-enter');
    });

    it('deve animar ao combinar tiles', async () => {
      await wrapper.setProps({ isMatching: true });
      
      const tile = wrapper.find('.tile');
      expect(tile.classes()).toContain('tile-match');
    });

    it('deve ter animação de erro para jogada inválida', async () => {
      wrapper.vm.showError();
      await wrapper.vm.$nextTick();
      
      const tile = wrapper.find('.tile');
      expect(tile.classes()).toContain('tile-error');
      expect(navigator.vibrate).toHaveBeenCalledWith([50, 100, 50]);
    });
  });

  describe('Performance', () => {
    it('deve usar transform para posicionamento', () => {
      const tile = wrapper.find('.tile');
      const style = tile.element.style;
      
      expect(style.transform).toContain('translate3d');
      expect(style.position).toBe('absolute');
    });

    it('deve ter will-change para otimização', () => {
      const tile = wrapper.find('.tile');
      const style = getComputedStyle(tile.element);
      
      expect(style.willChange).toContain('transform');
    });
  });

  describe('Acessibilidade Mobile', () => {
    it('deve ter role e aria-label adequados', () => {
      const tile = wrapper.find('.tile');
      
      expect(tile.attributes('role')).toBe('button');
      expect(tile.attributes('aria-label')).toContain('bamboo 3');
    });

    it('deve indicar estado selecionado via ARIA', async () => {
      await wrapper.setProps({ tile: { ...mockTile, isSelected: true } });
      
      const tile = wrapper.find('.tile');
      expect(tile.attributes('aria-pressed')).toBe('true');
    });

    it('deve ter tabindex adequado', () => {
      const tile = wrapper.find('.tile');
      expect(tile.attributes('tabindex')).toBe('0');
      
      // Tile bloqueado não deve ser focável
      wrapper.setProps({ tile: { ...mockTile, isBlocked: true } });
      expect(tile.attributes('tabindex')).toBe('-1');
    });
  });
});