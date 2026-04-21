import type { GameManifest } from '../../games/types';
import { CAPITALS_QUIZ_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'capitals-quiz',
    published: false,
    image: 'og-image.png',
    i18n: CAPITALS_QUIZ_I18N,
    locales: {
        en: {
            title: 'World Capitals Quiz - Find Capital Cities on the Globe | JordGlobe',
            description: 'Can you locate world capitals on a 3D globe? Test your knowledge of capital cities in this interactive geography quiz game.',
            ogTitle: 'World Capitals Quiz - Find Capital Cities',
            ogDescription: 'Can you locate world capitals on a 3D globe? Test your knowledge in this interactive quiz.',
        },
    },
};
