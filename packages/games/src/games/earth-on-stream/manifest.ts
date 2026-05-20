import type { GameManifest } from '../types';
import { EARTH_ON_STREAM_I18N } from './i18n';

export const manifest: GameManifest = {
    id: 'earth-on-stream',
    published: false,
    image: 'og-earth-on-stream.jpg',
    i18n: EARTH_ON_STREAM_I18N,
    locales: {
        en: {
            title: 'Earth on Stream | JordGlobe',
            description: 'Watch the Earth slowly spin on an interactive 3D globe.',
            ogTitle: 'Earth on Stream',
            ogDescription: 'A slowly spinning 3D Earth globe.',
        },
        sv: {
            title: 'Earth on Stream | JordGlobe',
            description: 'Se jorden snurra långsamt på en interaktiv 3D-glob.',
            ogTitle: 'Earth on Stream',
            ogDescription: 'En långsamt snurrande 3D-jordglob.',
        },
    },
};
