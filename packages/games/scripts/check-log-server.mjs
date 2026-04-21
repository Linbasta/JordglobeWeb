#!/usr/bin/env node
/**
 * Checks if the log server is running on port 9999.
 * Exits with code 1 if not running.
 */

import { createConnection } from 'net';

const PORT = 9999;
const TIMEOUT = 1000;

const socket = createConnection({ port: PORT, host: 'localhost' });

socket.setTimeout(TIMEOUT);

socket.on('connect', () => {
    socket.destroy();
    process.exit(0); // Server is running
});

socket.on('error', () => {
    console.error('\x1b[31m%s\x1b[0m', '✗ Log server not running!');
    console.error('  Start it first: npm run log-server');
    console.error('  (or from root:  pnpm --filter @jordglobe/games log-server)\n');
    process.exit(1);
});

socket.on('timeout', () => {
    socket.destroy();
    console.error('\x1b[31m%s\x1b[0m', '✗ Log server not responding');
    process.exit(1);
});
