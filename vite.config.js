import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Served at the root of the custom domain (wc26.neeldhanesha.com).
  // If you ever revert to the github.io project URL, set this back to
  // '/cloudy-with-a-chance-of-football/'.
  base: '/',
})
