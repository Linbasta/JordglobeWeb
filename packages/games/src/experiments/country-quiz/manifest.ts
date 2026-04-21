import type { GameManifest } from '../../games/types';
import { COUNTRY_QUIZ_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'country-quiz',
    published: false,
    image: 'og-image.png',
    i18n: COUNTRY_QUIZ_I18N,
    locales: {
        en: {
            title: 'Country Quiz - Find Countries on the Globe | JordGlobe',
            description: 'Can you find countries on a 3D globe? Test your geography skills by locating countries around the world in this interactive quiz game.',
            ogTitle: 'Country Quiz - Find Countries on the Globe',
            ogDescription: 'Can you find countries on a 3D globe? Test your geography skills in this interactive quiz.',
        },
    },
};
