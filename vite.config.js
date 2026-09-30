import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/goorm-260930-unsplash-quote-insta/', // GitHub Pages: repository 이름과 동일하게 맞춰야 함
})
