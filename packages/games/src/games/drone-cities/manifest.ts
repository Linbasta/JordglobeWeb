import type { GameManifest } from '../types';
import { DRONE_CITIES_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'drone-cities',
    published: false,
    image: 'og-drone-cities.jpg',
    i18n: DRONE_CITIES_I18N,
    locales: {
        en: {
            title: 'Drone Cities - Guess the City from Aerial Footage | JordGlobe',
            description:
                'Watch drone footage of cities from around the world and guess each one on an interactive 3D globe.',
            ogTitle: 'Drone Cities - Guess the City from Aerial Footage',
            ogDescription:
                'Watch drone footage and pinpoint each city on an interactive 3D globe.',
        },
        sv: {
            title: 'Drone Cities - Gissa staden från drönarbilder | JordGlobe',
            description:
                'Se drönarvideor från städer runt om i världen och gissa varje stad på en interaktiv 3D-glob.',
            ogTitle: 'Drone Cities - Gissa staden från drönarbilder',
            ogDescription:
                'Se drönarvideor och pricka in varje stad på en interaktiv 3D-glob.',
        },
    },
};
