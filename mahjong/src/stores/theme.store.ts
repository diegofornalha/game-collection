import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const useThemeStore = defineStore('theme', () => {
  // Estado
  const currentTheme = ref<ThemeMode>('light');
  const systemPreference = ref<'light' | 'dark'>('light');
  
  // Detectar preferência do sistema
  const detectSystemPreference = () => {
    if (window.matchMedia) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      systemPreference.value = isDark ? 'dark' : 'light';
    }
  };
  
  // Computed para o tema efetivo
  const effectiveTheme = computed(() => {
    if (currentTheme.value === 'auto') {
      return systemPreference.value;
    }
    return currentTheme.value;
  });
  
  // Aplicar tema ao documento
  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    // Adicionar classe de transição
    root.classList.add('theme-transitioning');
    
    // Remover classes antigas
    root.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    // Adicionar nova classe
    if (currentTheme.value === 'auto') {
      root.classList.add('theme-auto');
    } else {
      root.classList.add(`theme-${theme}`);
    }
    
    // Remover classe de transição após animação
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 300);
    
    // Salvar preferência
    localStorage.setItem('theme-preference', currentTheme.value);
  };
  
  // Definir tema
  const setTheme = (theme: ThemeMode) => {
    currentTheme.value = theme;
  };
  
  // Alternar entre claro e escuro
  const toggleTheme = () => {
    if (currentTheme.value === 'dark') {
      setTheme('light');
    } else if (currentTheme.value === 'light') {
      setTheme('auto');
    } else {
      setTheme('dark');
    }
  };
  
  // Inicializar tema
  const initializeTheme = () => {
    // Detectar preferência do sistema
    detectSystemPreference();
    
    // Carregar preferência salva
    const savedTheme = localStorage.getItem('theme-preference') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      currentTheme.value = savedTheme;
    } else {
      // Padrão para tema claro
      currentTheme.value = 'light';
    }
    
    // Aplicar tema inicial
    applyTheme(effectiveTheme.value);
    
    // Ouvir mudanças na preferência do sistema
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        systemPreference.value = e.matches ? 'dark' : 'light';
        if (currentTheme.value === 'auto') {
          applyTheme(systemPreference.value);
        }
      });
    }
  };
  
  // Watch para mudanças no tema
  watch(currentTheme, () => {
    applyTheme(effectiveTheme.value);
  });
  
  watch(effectiveTheme, (newTheme) => {
    applyTheme(newTheme);
  });
  
  // Cores do tema atual
  const themeColors = computed(() => {
    const isDark = effectiveTheme.value === 'dark';
    
    return {
      primary: '#42b883',
      primaryLight: '#52d896',
      primaryDark: '#33a06f',
      secondary: '#35495e',
      accent: isDark ? '#ffd93d' : '#f39c12',
      success: isDark ? '#51cf66' : '#27ae60',
      warning: isDark ? '#ff9f43' : '#f39c12',
      error: isDark ? '#ee5a52' : '#e74c3c',
      info: isDark ? '#48c4e8' : '#3498db',
      
      // Fundos
      bgPrimary: isDark ? '#1a1a1a' : '#ffffff',
      bgSecondary: isDark ? '#252525' : '#f8f9fa',
      bgTertiary: isDark ? '#2d2d2d' : '#e9ecef',
      
      // Textos
      textPrimary: isDark ? '#ffffff' : '#2c3e50',
      textSecondary: isDark ? '#b0b0b0' : '#606c76',
      textTertiary: isDark ? '#808080' : '#9ca3af',
      
      // Bordas
      borderColor: isDark ? '#404040' : '#dee2e6',
      
      // Sombras
      shadowSm: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.12)',
      shadowMd: isDark ? '0 4px 8px rgba(0, 0, 0, 0.4)' : '0 4px 6px rgba(0, 0, 0, 0.15)',
      shadowLg: isDark ? '0 8px 16px rgba(0, 0, 0, 0.5)' : '0 10px 20px rgba(0, 0, 0, 0.15)',
    };
  });
  
  return {
    // Estado
    currentTheme,
    effectiveTheme,
    systemPreference,
    themeColors,
    
    // Ações
    setTheme,
    toggleTheme,
    initializeTheme,
    detectSystemPreference,
  };
});