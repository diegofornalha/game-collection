import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/styles/main.scss';
import { initializeGamificationStores } from './stores/initializeStores';
import * as Sentry from "@sentry/vue";

const app = createApp(App);
const pinia = createPinia();

// Configure Sentry following official documentation
Sentry.init({
  app,
  dsn: "https://e12b9f457709c8e451398bb1b7d88924@o4509787137638400.ingest.us.sentry.io/4509845941911552",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Setting this option to true will send default PII data to Sentry
  sendDefaultPii: true
});

app.use(pinia);
app.mount('#app');

// Initialize gamification system after app is mounted
initializeGamificationStores();