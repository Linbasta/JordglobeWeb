import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const isProd = process.env.NODE_ENV === 'production';

const env = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), '');
const allowedHosts = env.DEV_ALLOWED_HOSTS
    ? env.DEV_ALLOWED_HOSTS.split(',').map(h => h.trim()).filter(Boolean)
    : [];

export default defineConfig({
    base: '/games/',
    publicDir: './public-prod',
    server: {
        port: 4818,
        host: true,
        ...(allowedHosts.length > 0 ? { allowedHosts } : {}),
    },
    vite: {
        esbuild: isProd
            ? {
                // Strip noisy logs from prod bundles; keep warn/error for real reporting.
                pure: ['console.log', 'console.debug', 'console.info'],
                drop: ['debugger'],
            }
            : {},
        build: {
            rollupOptions: {
                // Don't bundle dev tools in production
                external: isProd
                    ? ['@babylonjs/inspector', '@babylonjs/core/Debug/debugLayer']
                    : [],
            },
        },
    },
});
