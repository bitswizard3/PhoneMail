import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Expose dev server on all network interfaces (0.0.0.0) so mobile
  // devices on the same WiFi can access the frontend.
  server: {
    host: true,   // equivalent to 0.0.0.0
    port: 5173,
  },
});
