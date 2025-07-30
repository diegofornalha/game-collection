import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/styles/main.scss';
import { initializeGamificationStores } from './stores/initializeStores';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');

// Initialize gamification system after app is mounted
initializeGamificationStores();