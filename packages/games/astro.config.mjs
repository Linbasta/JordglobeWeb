import { defineConfig } from 'astro/config';

export default defineConfig({
    base: '/games/',
    publicDir: './public-prod',
    server: {
        port: 4818,
        host: true,
    },
});
