import type { GameManifest } from '../../games/types';
import { GLOBE_TAXI_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'globe-taxi',
    published: false,
    image: 'og-image.png',
    i18n: GLOBE_TAXI_I18N,
    locales: {
        en: {
            title: 'Globe Taxi - Drive Around the World | JordGlobe',
            description: 'Drive a taxi across a 3D globe using the arrow keys.',
            ogTitle: 'Globe Taxi',
            ogDescription: 'Drive a taxi across a 3D globe.',
        },
    },
};
