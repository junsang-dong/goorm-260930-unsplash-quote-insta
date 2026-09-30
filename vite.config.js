import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel은 루트 도메인에서 서빙하므로 base가 '/'여야 하고,
  // GitHub Pages는 저장소 이름 하위 경로에서 서빙하므로 base를 맞춰야 한다.
  base: process.env.VERCEL ? '/' : '/goorm-260930-unsplash-quote-insta/',
})
