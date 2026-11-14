// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'

registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('pwa:offline-ready'))
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
