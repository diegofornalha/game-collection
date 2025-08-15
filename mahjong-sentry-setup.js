// Configuração Sentry para Projeto Mahjong Vue com Session Replay
// Arquivo: src/main.ts ou src/main.js

import { createApp } from "vue";
import { createRouter } from "vue-router";
import router from "./router";
import * as Sentry from "@sentry/vue";

const app = createApp({
  // ... sua configuração Vue
});

// Configuração Sentry otimizada para Mahjong
Sentry.init({
  app,
  dsn: "https://e12b9f457709c8e451398bb1b7d88924@o4509787137638400.ingest.us.sentry.io/4509845941911552",
  
  // Environment e Release tracking
  environment: process.env.NODE_ENV || "development",
  release: "mahjong-solitaire@2.0.0",
  
  // PII data for better debugging
  sendDefaultPii: true,
  
  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% em desenvolvimento, reduzir em produção
  
  // Integrations
  integrations: [
    // Session Replay - A ESTRELA DO SHOW!
    Sentry.replayIntegration({
      // Configuração para o jogo Mahjong
      maskAllText: false, // Queremos ver textos do jogo
      blockAllMedia: false, // Queremos ver as peças/imagens
      
      // Configurações específicas para games
      maskTextSelector: ".sensitive-info", // Mascarar apenas dados sensíveis
      blockSelector: ".user-private-data", // Bloquear dados privados
      
      // Performance
      sessionSampleRate: 0.1, // 10% das sessões normais
      errorSampleRate: 1.0, // 100% quando há erro - CRUCIAL para bugs!
      
      // Configurações de qualidade
      networkDetailAllowUrls: [window.location.origin],
      networkCaptureBodies: true,
      networkRequestHeaders: ['User-Agent'],
      networkResponseHeaders: ['Content-Type']
    }),
    
    // Browser Tracing para performance
    Sentry.browserTracingIntegration({
      // Configuração para SPA Vue
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      
      // Configurações específicas para jogo
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/yourapi\.domain\.com\/api/
      ],
      
      // Game-specific traces
      beforeNavigate: context => ({
        ...context,
        name: `Mahjong Game - ${context.name}`
      })
    })
  ],
  
  // Session Replay Sampling
  replaysSessionSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  replaysOnErrorSampleRate: 1.0, // SEMPRE gravar quando há erro!
  
  // Configurações específicas para jogos
  beforeSend(event, hint) {
    // Adicionar contexto específico do jogo se disponível
    if (window.gameState) {
      event.contexts = {
        ...event.contexts,
        game: {
          level: window.gameState.level,
          score: window.gameState.score,
          tiles_remaining: window.gameState.tilesRemaining,
          time_elapsed: window.gameState.timeElapsed
        }
      };
    }
    
    // Log para debugging
    console.log('Sentry event:', event);
    return event;
  },
  
  // Error filtering para reduzir ruído
  ignoreErrors: [
    // Ignore erros comuns que não são do nosso jogo
    "Non-Error promise rejection captured",
    "Script error.",
    "Network request failed" // A menos que seja crítico para o jogo
  ]
});

// Configurações globais para o jogo
Sentry.setTag("game", "mahjong-solitaire");
Sentry.setTag("version", "2.0.0");
Sentry.setContext("game_config", {
  difficulty: "adaptive",
  theme: "classic",
  sound_enabled: true,
  animations_enabled: true
});

app.use(router);
app.mount("#app");

// Export para uso em outros arquivos
export { Sentry };
