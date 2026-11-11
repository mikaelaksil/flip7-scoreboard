import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router, { EMBEDDED } from './router'
import './style.css'

createApp(App).use(createPinia()).use(router).mount('#app')

// Memory history has no URL to read, so start on the setup screen explicitly.
if (EMBEDDED) router.replace('/')
