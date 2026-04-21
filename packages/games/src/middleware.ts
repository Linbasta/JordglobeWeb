import fs from 'node:fs';
import path from 'node:path';
import { defineMiddleware } from 'astro:middleware';

const DEV_MIME: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.bin': 'application/octet-stream',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
};

function tryServe(rel: string, dirName: string): Response | null {
    const root = path.resolve(process.cwd(), dirName);
    let filePath = path.join(root, rel);
    if (!filePath.startsWith(root)) return null;

    let stat: fs.Stats;
    try {
        stat = fs.statSync(filePath);
    } catch {
        return null;
    }

    if (stat.isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        try {
            stat = fs.statSync(indexPath);
            filePath = indexPath;
        } catch {
            return null;
        }
    }

    const ext = path.extname(filePath).toLowerCase();
    const data = fs.readFileSync(filePath);
    return new Response(data, {
        status: 200,
        headers: { 'Content-Type': DEV_MIME[ext] ?? 'application/octet-stream' },
    });
}

export const onRequest = defineMiddleware(async (context, next) => {
    if (!import.meta.env.DEV) return next();
    const url = new URL(context.request.url);

    // /games/dev/* → public-dev/ (dev-only scratch)
    if (url.pathname.startsWith('/games/dev/') || url.pathname === '/games/dev') {
        const rel = url.pathname.startsWith('/games/dev/')
            ? url.pathname.slice('/games/dev/'.length)
            : '';
        const resp = tryServe(rel, 'public-dev');
        if (resp) return resp;
        return next();
    }

    // /games/* → legacy public/ fallback (for files that haven't migrated to public-prod/ yet).
    // Astro's own publicDir (public-prod/) already runs ahead of middleware, so this only
    // fires for URLs that public-prod/ didn't handle. Remove this block when public/ is retired.
    if (url.pathname.startsWith('/games/')) {
        const rel = url.pathname.slice('/games/'.length);
        const resp = tryServe(rel, 'public');
        if (resp) return resp;
    }

    return next();
});
