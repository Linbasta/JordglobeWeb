import type { GameManifest } from '../../games/types';
import { HOST_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'host',
    published: false,
    image: 'og-image.png',
    i18n: HOST_I18N,
    locales: {
        en: {
            title: 'JordGlobe Party - Host Display',
            description: 'Host screen for multiplayer geography game.',
            ogTitle: 'JordGlobe Party Host',
            ogDescription: 'Host screen for multiplayer geography game.',
        },
    },
};
