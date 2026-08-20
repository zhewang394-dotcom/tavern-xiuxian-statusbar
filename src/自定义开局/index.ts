import App from './App.vue';
import './global.css';
import './styles.css';

let initialized = false;

$(async () => {
  if (initialized) return;
  initialized = true;
  createApp(App).use(createPinia()).mount('#app');
});
