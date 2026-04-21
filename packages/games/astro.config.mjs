import { defineConfig } from 'astro/config';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
    base: '/games/',
    publicDir: './public-prod',
    server: {
        port: 4818,
        host: true,
    },
    vite: {
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
