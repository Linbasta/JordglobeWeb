import type { GameManifest } from '../types';
import { MEDALS_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'medals',
    published: false, // Set to true when ready to ship
    image: 'og-medals.png',
    i18n: MEDALS_I18N,
    locales: {
        en: {
            title: 'Geography Medals - Master Countries & Earn Achievements | JordGlobe',
            description:
                'Earn bronze, silver, and gold medals by mastering countries on the 3D globe. Track your progress and become a geography expert.',
            ogTitle: 'Geography Medals - Earn Achievements',
            ogDescription:
                'Earn bronze, silver, and gold medals by mastering countries on the 3D globe.',
        },
    },
};
