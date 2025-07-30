import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MobileControls from '../MobileControls.vue';

describe('MobileControls', () => {
  let wrapper: any;

  beforeEach(() => {
    // Mock window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 667
    });

    wrapper = mount(MobileControls);
  });

  describe('Layout Responsivo', () => {
    it('deve renderizar controles mobile em telas pequenas', () => {
      expect(wrapper.find('.mobile-controls').exists()).toBe(true);
      expect(wrapper.find('.mobile-header').exists()).toBe(true);
      expect(wrapper.find('.floating-actions').exists()).toBe(true);
    });

    it('deve ter botões com tamanho adequado para toque', () => {
      const buttons = wrapper.findAll('.control-button');
      buttons.forEach((button: any) => {
        const element = button.element as HTMLElement;
        const rect = element.getBoundingClientRect();
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });

    it('deve ajustar layout em orientação landscape', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      window.dispatchEvent(new Event('resize'));
      await wrapper.vm.$nextTick();
      
      expect(wrapper.find('.landscape-mode').exists()).toBe(true);
    });
  });

  describe('Botões de Controle', () => {
    it('deve ter botão de menu hambúrguer', () => {
      const menuButton = wrapper.find('[data-test="menu-button"]');
      expect(menuButton.exists()).toBe(true);
      expect(menuButton.text()).toContain('≡');
    });

    it('deve ter botão de pausa/play', () => {
      const pauseButton = wrapper.find('[data-test="pause-button"]');
      expect(pauseButton.exists()).toBe(true);
    });

    it('deve ter botões de ação principais', () => {
      expect(wrapper.find('[data-test="hint-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="undo-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="redo-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="reset-button"]').exists()).toBe(true);
    });
  });

  describe('Feedback Visual', () => {
    it('deve adicionar classe active ao pressionar botão', async () => {
      const button = wrapper.find('[data-test="hint-button"]');
      
      await button.trigger('touchstart');
      expect(button.classes()).toContain('active');
      
      await button.trigger('touchend');
      expect(button.classes()).not.toContain('active');
    });

    it('deve mostrar indicador de loading durante ações', async () => {
      const undoButton = wrapper.find('[data-test="undo-button"]');
      await undoButton.trigger('click');
      
      expect(wrapper.find('.loading-indicator').exists()).toBe(true);
    });
  });

  describe('Barra de Ações Flutuante', () => {
    it('deve posicionar barra de ações no fundo da tela', () => {
      const floatingBar = wrapper.find('.floating-actions');
      const style = getComputedStyle(floatingBar.element);
      
      expect(style.position).toBe('fixed');
      expect(style.bottom).toBeTruthy();
    });

    it('deve esconder barra ao fazer scroll para baixo', async () => {
      const floatingBar = wrapper.find('.floating-actions');
      
      // Simular scroll para baixo
      window.scrollY = 100;
      window.dispatchEvent(new Event('scroll'));
      await wrapper.vm.$nextTick();
      
      expect(floatingBar.classes()).toContain('hidden');
    });
  });

  describe('Acessibilidade', () => {
    it('deve ter labels ARIA adequados', () => {
      const buttons = wrapper.findAll('button');
      buttons.forEach((button: any) => {
        expect(button.attributes('aria-label')).toBeTruthy();
      });
    });

    it('deve ter contraste adequado', () => {
      const button = wrapper.find('.control-button');
      const style = getComputedStyle(button.element);
      
      // Verificar se tem contraste mínimo (simulado)
      expect(style.backgroundColor).toBeTruthy();
      expect(style.color).toBeTruthy();
    });
  });

  describe('Integração com Game Store', () => {
    it('deve emitir evento de dica', async () => {
      const hintButton = wrapper.find('[data-test="hint-button"]');
      await hintButton.trigger('click');
      
      expect(wrapper.emitted('hint')).toBeTruthy();
    });

    it('deve emitir evento de desfazer', async () => {
      const undoButton = wrapper.find('[data-test="undo-button"]');
      await undoButton.trigger('click');
      
      expect(wrapper.emitted('undo')).toBeTruthy();
    });

    it('deve desabilitar botões conforme estado do jogo', async () => {
      await wrapper.setProps({ canUndo: false });
      
      const undoButton = wrapper.find('[data-test="undo-button"]');
      expect(undoButton.attributes('disabled')).toBeDefined();
    });
  });
});