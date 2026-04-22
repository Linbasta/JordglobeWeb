import { buildDailyLeaderboards } from './index.js';

buildDailyLeaderboards()
    .then((result) => {
        console.log('[run-once] success', result);
        process.exit(0);
    })
    .catch((err) => {
        console.error('[run-once] failed', err);
        process.exit(1);
    });
