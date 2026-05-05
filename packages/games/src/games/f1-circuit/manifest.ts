import type { GameManifest } from '../types';
import { F1_CIRCUIT_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'f1-circuit',
    published: false,
    image: 'og-f1-circuit.jpg',
    i18n: F1_CIRCUIT_I18N,
    locales: {
        en: {
            title: 'F1 Circuits - Guess the Track Location | JordGlobe',
            description:
                'Look at a Formula 1 circuit and pinpoint where in the world it is on an interactive 3D globe.',
            ogTitle: 'F1 Circuits - Guess the Track Location',
            ogDescription:
                'Identify Formula 1 circuits and place them on the globe.',
        },
        sv: {
            title: 'F1-banor - Gissa platsen | JordGlobe',
            description:
                'Titta på en Formel 1-bana och placera den på en interaktiv 3D-glob.',
            ogTitle: 'F1-banor - Gissa platsen',
            ogDescription:
                'Identifiera Formel 1-banor och placera dem på globen.',
        },
    },
};
