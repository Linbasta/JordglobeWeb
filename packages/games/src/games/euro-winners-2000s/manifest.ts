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
    },
};
