import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['carecar.online', 'www.carecar.online'],
    proxy: {
      '/auth': 'http://localhost:8000',
      '/tenants': 'http://localhost:8000',
      '/cars': 'http://localhost:8000',
      '/services': 'http://localhost:8000',
      '/invoices': 'http://localhost:8000',
      '/inventory': 'http://localhost:8000',
      '/debts': 'http://localhost:8000',
      '/reports': 'http://localhost:8000',
      '/settings': 'http://localhost:8000',
      '/vision': 'http://localhost:8000',
    },
  },
})
