export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>PLAY</title></head><body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;height:100vh;width:100vw;background:#111;"><span style="color:#fff;font-size:10vw;font-weight:bold;">PLAY</span></body></html>`, {
    headers: { 'Content-Type': 'text/html' }
  });
}; 