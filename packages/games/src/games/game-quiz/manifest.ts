import type { GameManifest } from '../types';
import { GAME_QUIZ_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'game-quiz',
    published: true,
    image: 'og-game-quiz.png',
    i18n: GAME_QUIZ_I18N,
    locales: {
        en: {
            title: 'Video Game Origins - Guess the Country | JordGlobe',
            description:
                'Watch clips of famous video games and guess which country created each one on an interactive 3D globe.',
            ogTitle: 'Video Game Origins - Guess the Country',
            ogDescription:
                'Watch clips of famous video games and guess which country each one is from in this interactive 3D globe quiz.',
        },
        sv: {
            title: 'Datorspelens ursprung - Gissa landet | JordGlobe',
            description:
                'Se klipp från kända datorspel och gissa vilket land som skapade dem på en interaktiv 3D-glob.',
            ogTitle: 'Datorspelens ursprung - Gissa landet',
            ogDescription:
                'Se klipp från kända datorspel och gissa vilket land vart och ett kommer från i detta interaktiva 3D-globquiz.',
        },
    },
};
