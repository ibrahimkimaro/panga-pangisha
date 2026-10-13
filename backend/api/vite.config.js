import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            // Saving PHP that feeds a page (controllers, routes, the root view) reloads the browser too.
            refresh: ['app/**', 'routes/**', 'resources/views/**'],
        }),
        react(),
        tailwindcss(),
    ],
    resolve: { alias: { '@': '/resources/js' } },
    server: {
        host: '0.0.0.0', // reachable from outside the dev container
        port: 5173,
        strictPort: true,
        hmr: { host: 'localhost' }, // what the browser connects back to
        watch: { ignored: ['**/storage/**', '**/vendor/**'] },
    },
});
