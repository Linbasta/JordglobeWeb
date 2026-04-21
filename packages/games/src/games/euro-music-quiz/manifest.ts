import type { GameManifest } from '../types';
import { EURO_MUSIC_QUIZ_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'euro-music-quiz',
    published: true,
    image: 'og-euro-music-quiz.jpg',
    i18n: EURO_MUSIC_QUIZ_I18N,
    locales: {
        en: {
            title: 'Euro Music Quiz - Guess Eurovision 2026 Songs | JordGlobe',
            description:
                'Watch Eurovision Song Contest 2026 entries and guess which country each performance is from on an interactive 3D globe. Test your Eurovision knowledge!',
            ogTitle: 'Euro Music Quiz 2026 - Guess the Country from the Song',
            ogDescription:
                'Watch Eurovision 2026 performances and guess which country each one is from in this interactive 3D globe quiz.',
        },
        sv: {
            title: 'Euro Music Quiz - Gissa Eurovision 2026-låtar | JordGlobe',
            description:
                'Se Eurovision Song Contest 2026-bidragen och gissa vilket land varje framträdande kommer ifrån på en interaktiv 3D-glob. Testa dina Eurovision-kunskaper!',
            ogTitle: 'Euro Music Quiz 2026 - Gissa landet från låten',
            ogDescription:
                'Se Eurovision 2026-framträdanden och gissa vilket land de kommer ifrån i detta interaktiva 3D-globquiz.',
        },
    },
};
