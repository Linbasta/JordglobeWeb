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
        de: {
            title: 'Euro Music Quiz - Errate die Eurovision-2026-Songs | JordGlobe',
            description:
                'Sieh dir die Beiträge des Eurovision Song Contest 2026 an und errate, aus welchem Land jeder Auftritt stammt – auf einem interaktiven 3D-Globus. Teste dein Eurovision-Wissen!',
            ogTitle: 'Euro Music Quiz 2026 - Errate das Land anhand des Songs',
            ogDescription:
                'Sieh dir die Eurovision-2026-Auftritte an und errate auf einem interaktiven 3D-Globus, aus welchem Land sie stammen.',
        },
        fr: {
            title: 'Euro Music Quiz - Devine les chansons de l\'Eurovision 2026 | JordGlobe',
            description:
                'Regarde les titres du Concours Eurovision 2026 et devine de quel pays vient chaque prestation sur un globe 3D interactif. Mets tes connaissances Eurovision à l\'épreuve !',
            ogTitle: 'Euro Music Quiz 2026 - Devine le pays d\'après la chanson',
            ogDescription:
                'Regarde les prestations de l\'Eurovision 2026 et devine de quel pays elles viennent sur un globe 3D interactif.',
        },
    },
};
