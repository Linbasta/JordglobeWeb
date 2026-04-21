import type { GameManifest } from '../../games/types';
import { PARTY_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'party',
    published: false,
    image: 'og-image.png',
    i18n: PARTY_I18N,
    locales: {
        en: {
            title: 'JordGlobe Party - Join the Game',
            description: 'Join a multiplayer geography game on your mobile device.',
            ogTitle: 'JordGlobe Party',
            ogDescription: 'Join a multiplayer geography game on your mobile device.',
        },
    },
};
