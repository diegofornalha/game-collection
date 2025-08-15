import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/styles/main.scss';
import './assets/styles/themes.scss';
import { initializeGamificationStores } from './stores/initializeStores';
import { useThemeStore } from './stores/theme.store';
import * as Sentry from "@sentry/vue";

const app = createApp(App);
const pinia = createPinia();

// Função helper para converter string para boolean
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Função helper para converter string para número
const parseFloat = (value: string | undefined, defaultValue: number = 0): number => {
  if (!value) return defaultValue;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Configure Sentry with advanced Session Replay settings
Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://e12b9f457709c8e451398bb1b7d88924@o4509787137638400.ingest.us.sentry.io/4509845941911552",
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
  release: import.meta.env.VITE_SENTRY_RELEASE || 'mahjong@1.0.0',
  
  integrations: [
    // Browser Tracing para monitoramento de performance
    Sentry.browserTracingIntegration({
      // Rastrear requisições XHR/fetch
      tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    }),
    
    // Session Replay com configurações otimizadas
    Sentry.replayIntegration({
      // === CONFIGURAÇÕES DE PRIVACIDADE ===
      maskAllText: parseBoolean(import.meta.env.VITE_SENTRY_MASK_ALL_TEXT, true),
      maskAllInputs: true, // Sempre mascarar inputs por segurança
      blockAllMedia: parseBoolean(import.meta.env.VITE_SENTRY_BLOCK_ALL_MEDIA, false),
      
      // Seletores CSS para elementos que sempre devem ser mascarados
      mask: [
        '.sensitive-data',
        '.user-email',
        '.user-phone',
        '[data-mask="true"]',
      ],
      
      // Seletores CSS para elementos que nunca devem ser mascarados
      unmask: [
        '.game-score',
        '.level-display',
        '.public-content',
      ],
      
      // === OTIMIZAÇÕES DE PERFORMANCE ===
      // Limitar o tamanho máximo da gravação (em bytes)
      maxReplayDuration: 600000, // 10 minutos máximo
      
      // Configuração de throttling para reduzir uso de CPU
      stickySession: true, // Manter sessão mesmo após reload
      
      // Configuração de network
      networkDetailAllowUrls: [window.location.origin],
      networkCaptureBodies: false, // Não capturar bodies de requisições
      networkRequestHeaders: ['Content-Type'], // Apenas headers essenciais
      networkResponseHeaders: ['Content-Type'],
      
      // === FILTRAGEM DE CONTEÚDO ===
      // Ignorar certos tipos de interação
      beforeAddRecordingEvent: (event: any) => {
        // Filtrar eventos de movimento do mouse em excesso
        if (event.type === 3 && event.data && 'source' in event.data && event.data.source === 1) {
          // Throttle mouse move events
          const now = Date.now();
          if (!window._lastMouseMove || now - window._lastMouseMove > 50) {
            window._lastMouseMove = now;
            return event;
          }
          return null;
        }
        return event;
      },
    }),
  ],
  
  // === PERFORMANCE MONITORING ===
  tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0.3),
  
  // === SESSION REPLAY SAMPLING ===
  replaysSessionSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE, 0.1),
  replaysOnErrorSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE, 1.0),
  
  // === CONFIGURAÇÕES GERAIS ===
  // Não enviar PII por padrão para conformidade com LGPD/GDPR
  sendDefaultPii: false,
  
  // Configuração de ambiente
  debug: import.meta.env.DEV, // Debug apenas em desenvolvimento
  
  // === FILTRAGEM DE ERROS ===
  beforeSend(event) {
    // Filtrar eventos informativos do sentry-mcp-cursor
    if (event.message) {
      const infoMessages = [
        'Analyzing commit strategy',
        'Proposing sentry-mcp-cursor',
        'Sentry Session Replay setup recommendation',
        'submodule',
        'git submodule'
      ];
      
      // Verificar se é uma mensagem informativa
      if (infoMessages.some(msg => event.message.includes(msg))) {
        console.log('[Sentry] Filtered informational message:', event.message);
        return null; // Não enviar para o Sentry
      }
    }
    
    // Filtrar erros conhecidos ou irrelevantes
    if (event.exception?.values?.[0]?.value) {
      const errorMessage = event.exception.values[0].value;
      
      // Lista de erros para ignorar
      const ignoredErrors = [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Network request failed',
        'Load failed',
      ];
      
      if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
        console.log('[Sentry] Filtered known error:', errorMessage);
        return null;
      }
    }
    
    // Adicionar contexto extra para o jogo
    event.contexts = {
      ...event.contexts,
      game: {
        level: localStorage.getItem('currentLevel') || 'unknown',
        score: localStorage.getItem('currentScore') || '0',
        sessionTime: performance.now(),
      },
    };
    
    return event;
  },
  
  // === CONFIGURAÇÕES DE BREADCRUMBS ===
  beforeBreadcrumb(breadcrumb, hint) {
    // Filtrar breadcrumbs desnecessários
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }
    
    // Adicionar mais contexto aos breadcrumbs de clique
    if (breadcrumb.category === 'ui.click') {
      const target = hint?.event?.target;
      if (target) {
        breadcrumb.message = `Clicked: ${target.className || target.tagName}`;
      }
    }
    
    return breadcrumb;
  },
  
  // === TAGS E CONTEXTO INICIAL ===
  initialScope: {
    tags: { 
      component: 'mahjong-game',
      version: import.meta.env.VITE_SENTRY_RELEASE || 'unknown',
    },
    user: {
      id: localStorage.getItem('userId') || 'anonymous',
    },
  },
});

app.use(pinia);
app.mount('#app');

// Initialize gamification system after app is mounted
initializeGamificationStores();

// Initialize theme system
const themeStore = useThemeStore();
themeStore.initializeTheme();