import type { GameManifest } from '../types';
import { EUROVISION_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'eurovision',
    published: true,
    image: 'og-eurovision.jpg',
    i18n: EUROVISION_I18N,
    locales: {
        en: {
            title: 'Eurovision Quiz - Guess Songs from Eurovision 2026 | JordGlobe',
            description:
                'Watch Eurovision Song Contest 2026 entries and guess which country each performance is from on an interactive 3D globe. Test your Eurovision knowledge!',
            ogTitle: 'Eurovision 2026 Quiz - Guess the Country from the Song',
            ogDescription:
                'Watch Eurovision 2026 performances and guess which country each one is from in this interactive 3D globe quiz.',
        },
        sv: {
            title: 'Eurovision Quiz - Gissa låtar från Eurovision 2026 | JordGlobe',
            description:
                'Se Eurovision Song Contest 2026-bidragen och gissa vilket land varje framträdande kommer ifrån på en interaktiv 3D-glob. Testa dina Eurovision-kunskaper!',
            ogTitle: 'Eurovision 2026 Quiz - Gissa landet från låten',
            ogDescription:
                'Se Eurovision 2026-framträdanden och gissa vilket land de kommer ifrån i detta interaktiva 3D-globquiz.',
        },
    },
};
