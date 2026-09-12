import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const requiredFirebaseVariables = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const missingVariables = requiredFirebaseVariables.filter((name) => !env[name] || env[name].startsWith('your-'))

  if (command === 'build' && missingVariables.length) {
    throw new Error(`Missing required Firebase environment variables: ${missingVariables.join(', ')}`)
  }

  return {
    plugins: [react()],
  }
})
