import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// CHANGE 'german-app' TO YOUR GITHUB REPO NAME IF DIFFERENT
export default defineConfig({
  plugins: [react()],
  base: '/german-app/', 
})