// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset,
  images: ['public/logo.svg'],
})
