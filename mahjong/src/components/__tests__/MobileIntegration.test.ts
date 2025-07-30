import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MobileGameBoard from '../MobileGameBoard.vue';
import MobileControls from '../MobileControls.vue';

// Mock do navigator
(global as any).navigator = {
  ...(global as any).navigator,
  vibrate: vi.fn()
};

// Mock do window size
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 375
});
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  value: 667
});

describe('Mobile UI Integration', () => {
  let pinia: any;
  // let gameStore: any;
  
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    // gameStore = useGameStore();
  });

  describe('Layout Mobile Completo', () => {
    it('deve renderizar todos os componentes mobile corretamente', async () => {
      // Criar tiles de teste
      const tiles: any[] = [
        { id: 1, type: 'bamboo', value: 1, x: 0, y: 0, z: 0, isBlocked: false, isSelected: false, isHinted: false },
        { id: 2, type: 'bamboo', value: 2, x: 1, y: 0, z: 0, isBlocked: false, isSelected: false, isHinted: false },
        { id: 3, type: 'bamboo', value: 3, x: 0, y: 1, z: 0, isBlocked: true, isSelected: false, isHinted: false },
        { id: 4, type: 'bamboo', value: 1, x: 0, y: 0, z: 1, isBlocked: false, isSelected: false, isHinted: false },
      ];
      
      const boardWrapper = mount(MobileGameBoard, {
        props: { tiles }
      });
      
      const controlsWrapper = mount(MobileControls, {
        props: {
          score: 100,
          time: 120,
          isPaused: false,
          canUndo: true,
          canRedo: false
        }
      });
      
      // Verificar renderização
      expect(boardWrapper.find('.mobile-game-board').exists()).toBe(true);
      expect(boardWrapper.find('.tiles-container').exists()).toBe(true);
      expect(controlsWrapper.find('.mobile-controls').exists()).toBe(true);
      
      // Verificar número de tiles renderizados
      const renderedTiles = boardWrapper.findAll('.mobile-tile-wrapper');
      expect(renderedTiles.length).toBe(tiles.length);
    });
  });

  describe('Interação Touch', () => {
    it('deve selecionar tile ao tocar', async () => {
      const tiles: any[] = [
        { id: 1, type: 'bamboo', value: 1, x: 0, y: 0, z: 0, isBlocked: false, isSelected: false, isHinted: false }
      ];
      
      const wrapper = mount(MobileGameBoard, {
        props: { tiles: tiles as any }
      });
      
      const tile = wrapper.find('.tile');
      await tile.trigger('click');
      
      expect(wrapper.emitted('tileSelect')).toBeTruthy();
      expect(wrapper.emitted('tileSelect')![0]).toEqual([tiles[0]]);
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });

    it('não deve selecionar tiles bloqueados', async () => {
      const tiles: any[] = [
        { id: 1, type: 'bamboo', value: 1, x: 0, y: 0, z: 0, isBlocked: true, isSelected: false, isHinted: false }
      ];
      
      const wrapper = mount(MobileGameBoard, {
        props: { tiles: tiles as any }
      });
      
      const tile = wrapper.find('.tile');
      await tile.trigger('click');
      
      expect(wrapper.emitted('tileSelect')).toBeFalsy();
    });
  });

  describe('Layout Responsivo', () => {
    it('deve ajustar escala em telas pequenas', async () => {
      const tiles = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        type: 'bamboo',
        value: (i % 4) + 1,
        x: i % 5,
        y: Math.floor(i / 5),
        z: 0,
        isBlocked: false,
        isSelected: false,
        isHinted: false
      }));
      
      const wrapper = mount(MobileGameBoard, {
        props: { tiles: tiles as any }
      });
      
      await wrapper.vm.$nextTick();
      
      const container = wrapper.find('.tiles-container');
      const style = (container.element as HTMLElement).style;
      
      // Verificar se tem escala aplicada
      expect(style.transform).toContain('scale');
    });

    it('deve mostrar informações de camadas corretamente', () => {
      const tiles: any[] = [
        { id: 1, type: 'bamboo', value: 1, x: 0, y: 0, z: 0, isBlocked: false, isSelected: false, isHinted: false },
        { id: 2, type: 'bamboo', value: 2, x: 0, y: 0, z: 1, isBlocked: false, isSelected: false, isHinted: false },
        { id: 3, type: 'bamboo', value: 3, x: 0, y: 0, z: 2, isBlocked: false, isSelected: false, isHinted: false }
      ];
      
      const wrapper = mount(MobileGameBoard, {
        props: { tiles: tiles as any }
      });
      
      const info = wrapper.find('.tiles-info');
      expect(info.text()).toContain('3 peças disponíveis');
      expect(info.text()).toContain('Camada');
    });
  });

  describe('Controles Mobile', () => {
    it('deve executar ações dos botões corretamente', async () => {
      const wrapper = mount(MobileControls);
      
      // Testar botão de dica
      const hintButton = wrapper.find('[data-test="hint-button"]');
      await hintButton.trigger('click');
      expect(wrapper.emitted('hint')).toBeTruthy();
      
      // Testar botão de desfazer
      const undoButton = wrapper.find('[data-test="undo-button"]');
      await undoButton.trigger('click');
      expect(wrapper.emitted('undo')).toBeTruthy();
      
      // Testar botão de pausa
      const pauseButton = wrapper.find('[data-test="pause-button"]');
      await pauseButton.trigger('click');
      expect(wrapper.emitted('pause')).toBeTruthy();
    });

    it('deve mostrar tempo formatado corretamente', () => {
      const wrapper = mount(MobileControls, {
        props: { time: 125 } // 2:05
      });
      
      const timer = wrapper.find('.timer');
      expect(timer.text()).toBe('⏱ 2:05');
    });
  });

  describe('Performance Mobile', () => {
    it('deve renderizar apenas tiles visíveis em mobile', () => {
      // Criar muitos tiles em várias camadas
      const tiles: any[] = [];
      for (let z = 0; z < 5; z++) {
        for (let y = 0; y < 10; y++) {
          for (let x = 0; x < 10; x++) {
            tiles.push({
              id: tiles.length + 1,
              type: 'bamboo',
              value: 1,
              x, y, z,
              isBlocked: z < 3, // Camadas inferiores bloqueadas
              isSelected: false,
              isHinted: false
            });
          }
        }
      }
      
      const wrapper = mount(MobileGameBoard, {
        props: { tiles, layout: 'mobile' }
      });
      
      const visibleTiles = (wrapper.vm as any).visibleTiles;
      
      // Em mobile, deve mostrar menos tiles
      expect(visibleTiles.length).toBeLessThan(tiles.length);
      
      // Deve incluir todas as tiles não bloqueadas
      const unblockedTiles = tiles.filter(t => !t.isBlocked);
      unblockedTiles.forEach(tile => {
        expect(visibleTiles).toContainEqual(tile);
      });
    });
  });

  describe('Feedback Háptico', () => {
    it('deve vibrar em diferentes situações', async () => {
      const wrapper = mount(MobileControls);
      
      vi.clearAllMocks();
      
      // Vibrar ao tocar botão
      const button = wrapper.find('[data-test="hint-button"]');
      await button.trigger('click');
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
      
      // Vibrar ao pausar
      vi.clearAllMocks();
      const pauseButton = wrapper.find('[data-test="pause-button"]');
      await pauseButton.trigger('click');
      expect(navigator.vibrate).toHaveBeenCalledWith(10);
    });
  });

  describe('Orientação da Tela', () => {
    it('deve adaptar layout em modo landscape', async () => {
      // Simular landscape
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      const wrapper = mount(MobileControls);
      
      window.dispatchEvent(new Event('resize'));
      await wrapper.vm.$nextTick();
      
      expect(wrapper.find('.landscape-mode').exists()).toBe(true);
    });
  });

  describe('Acessibilidade Mobile', () => {
    it('deve ter atributos ARIA corretos', () => {
      const tiles: any[] = [
        { id: 1, type: 'bamboo', value: 1, x: 0, y: 0, z: 0, isBlocked: false, isSelected: true, isHinted: false }
      ];
      
      const wrapper = mount(MobileGameBoard, {
        props: { tiles: tiles as any }
      });
      
      const tile = wrapper.find('.tile');
      expect(tile.attributes('role')).toBe('button');
      expect(tile.attributes('aria-label')).toContain('bamboo 1');
      expect(tile.attributes('aria-pressed')).toBe('true');
    });

    it('deve ter tamanhos de toque adequados', () => {
      const wrapper = mount(MobileControls);
      
      const buttons = wrapper.findAll('.control-button');
      buttons.forEach((button: any) => {
        const rect = button.element.getBoundingClientRect();
        // Mínimo recomendado é 44x44px
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });
  });
});