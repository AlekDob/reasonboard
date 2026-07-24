import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { whiteboardSavePlugin } from './vite-plugin-wb-save.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), whiteboardSavePlugin()],
})
