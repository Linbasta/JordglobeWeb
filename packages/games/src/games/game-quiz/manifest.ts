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
        de: {
            title: 'Videospiel-Herkunft - Errate das Land | JordGlobe',
            description:
                'Sieh dir Clips berühmter Videospiele an und errate auf einem interaktiven 3D-Globus, in welchem Land jedes davon entstanden ist.',
            ogTitle: 'Videospiel-Herkunft - Errate das Land',
            ogDescription:
                'Sieh dir Clips berühmter Videospiele an und errate in diesem interaktiven 3D-Globus-Quiz, aus welchem Land sie stammen.',
        },
        fr: {
            title: 'Origine des jeux vidéo - Devine le pays | JordGlobe',
            description:
                'Regarde des extraits de jeux vidéo célèbres et devine sur un globe 3D interactif quel pays a créé chacun d\'eux.',
            ogTitle: 'Origine des jeux vidéo - Devine le pays',
            ogDescription:
                'Regarde des extraits de jeux vidéo célèbres et devine de quel pays vient chacun dans ce quiz globe 3D interactif.',
        },
        it: {
            title: 'Origini dei videogiochi - Indovina il paese | JordGlobe',
            description:
                'Guarda clip di videogiochi famosi e indovina su un globo 3D interattivo in quale paese è stato creato ognuno di essi.',
            ogTitle: 'Origini dei videogiochi - Indovina il paese',
            ogDescription:
                'Guarda clip di videogiochi famosi e indovina da quale paese proviene ognuno in questo quiz su globo 3D interattivo.',
        },
        pl: {
            title: 'Pochodzenie gier wideo - Zgadnij kraj | JordGlobe',
            description:
                'Obejrzyj klipy ze słynnych gier wideo i zgadnij na interaktywnym globusie 3D, w jakim kraju powstała każda z nich.',
            ogTitle: 'Pochodzenie gier wideo - Zgadnij kraj',
            ogDescription:
                'Obejrzyj klipy ze słynnych gier wideo i zgadnij, z jakiego kraju pochodzą, w tym interaktywnym quizie z globusem 3D.',
        },
        es: {
            title: 'Origen de los videojuegos - Adivina el país | JordGlobe',
            description:
                'Mira clips de videojuegos famosos y adivina en un globo 3D interactivo en qué país se creó cada uno.',
            ogTitle: 'Origen de los videojuegos - Adivina el país',
            ogDescription:
                'Mira clips de videojuegos famosos y adivina de qué país es cada uno en este cuestionario interactivo en un globo 3D.',
        },
        pt: {
            title: 'Origem dos videogames - Adivinhe o país | JordGlobe',
            description:
                'Assista a clipes de videogames famosos e adivinhe em um globo 3D interativo em qual país cada um foi criado.',
            ogTitle: 'Origem dos videogames - Adivinhe o país',
            ogDescription:
                'Assista a clipes de videogames famosos e adivinhe de qual país é cada um neste quiz interativo em um globo 3D.',
        },
    },
};
