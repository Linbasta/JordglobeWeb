import type { GameManifest } from '../types';
import { EURO_WINNERS_2000S_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'euro-winners-2000s',
    published: true,
    image: 'og-euro-winners-2000s.jpg',
    i18n: EURO_WINNERS_2000S_I18N,
    locales: {
        en: {
            title: 'Euro Music Winners 2000-2025 - Guess Eurovision Winners | JordGlobe',
            description:
                'Watch every Eurovision Song Contest winner from 2000 to 2025 and guess which country won. Test your Eurovision knowledge on an interactive 3D globe!',
            ogTitle: 'Euro Music Winners 2000-2025 - Guess the Country',
            ogDescription:
                'Watch every Eurovision winner from 2000 to 2025 and guess which country took the trophy in this interactive 3D globe quiz.',
        },
        sv: {
            title: 'Euro Music-vinnare 2000–2025 - Gissa Eurovision-vinnarna | JordGlobe',
            description:
                'Se varje Eurovision-vinnare från 2000 till 2025 och gissa vilket land som vann. Testa dina Eurovision-kunskaper på en interaktiv 3D-glob!',
            ogTitle: 'Euro Music-vinnare 2000–2025 - Gissa landet',
            ogDescription:
                'Se varje Eurovision-vinnare från 2000 till 2025 och gissa vilket land som tog hem trofén i detta interaktiva 3D-globquiz.',
        },
        de: {
            title: 'Euro Music-Sieger 2000–2025 - Errate die Eurovision-Sieger | JordGlobe',
            description:
                'Sieh dir jeden Eurovision-Sieger von 2000 bis 2025 an und errate, welches Land gewonnen hat. Teste dein Eurovision-Wissen auf einem interaktiven 3D-Globus!',
            ogTitle: 'Euro Music-Sieger 2000–2025 - Errate das Land',
            ogDescription:
                'Sieh dir jeden Eurovision-Sieger von 2000 bis 2025 an und errate auf einem interaktiven 3D-Globus, welches Land die Trophäe gewonnen hat.',
        },
        fr: {
            title: 'Gagnants Euro Music 2000–2025 - Devine les vainqueurs de l\'Eurovision | JordGlobe',
            description:
                'Regarde chaque vainqueur du Concours Eurovision de 2000 à 2025 et devine quel pays a gagné. Mets tes connaissances Eurovision à l\'épreuve sur un globe 3D interactif !',
            ogTitle: 'Gagnants Euro Music 2000–2025 - Devine le pays',
            ogDescription:
                'Regarde chaque vainqueur de l\'Eurovision de 2000 à 2025 et devine sur un globe 3D interactif quel pays a remporté le trophée.',
        },
        it: {
            title: 'Vincitori Euro Music 2000–2025 - Indovina i vincitori dell\'Eurovision | JordGlobe',
            description:
                'Guarda ogni vincitore dell\'Eurovision Song Contest dal 2000 al 2025 e indovina quale paese ha vinto. Metti alla prova le tue conoscenze sull\'Eurovision su un globo 3D interattivo!',
            ogTitle: 'Vincitori Euro Music 2000–2025 - Indovina il paese',
            ogDescription:
                'Guarda ogni vincitore dell\'Eurovision dal 2000 al 2025 e indovina su un globo 3D interattivo quale paese ha vinto il trofeo.',
        },
    },
};
