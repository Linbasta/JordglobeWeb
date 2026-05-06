import quizzesData from '../../../public-prod/quizzes.json';
import type { GameManifest } from '../types';
import type { QuizDef } from '../../quiz/types';
import { QUIZ_I18N } from './i18n';

export function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const TYPE_LABEL: Record<string, string> = {
    countries: 'countries',
    capitals: 'capitals',
    provinces: 'provinces',
    flags: 'flags',
    locations: 'locations',
};

const TYPE_LABEL_SV: Record<string, string> = {
    countries: 'länder',
    capitals: 'huvudstäder',
    provinces: 'provinser',
    flags: 'flaggor',
    locations: 'platser',
};

const TYPE_LABEL_DE: Record<string, string> = {
    countries: 'Länder',
    capitals: 'Hauptstädte',
    provinces: 'Provinzen',
    flags: 'Flaggen',
    locations: 'Orte',
};

const TYPE_LABEL_FR: Record<string, string> = {
    countries: 'pays',
    capitals: 'capitales',
    provinces: 'provinces',
    flags: 'drapeaux',
    locations: 'lieux',
};

const TYPE_LABEL_IT: Record<string, string> = {
    countries: 'paesi',
    capitals: 'capitali',
    provinces: 'province',
    flags: 'bandiere',
    locations: 'luoghi',
};

const TYPE_LABEL_PL: Record<string, string> = {
    countries: 'państw',
    capitals: 'stolic',
    provinces: 'prowincji',
    flags: 'flag',
    locations: 'miejsc',
};

const TYPE_LABEL_ES: Record<string, string> = {
    countries: 'países',
    capitals: 'capitales',
    provinces: 'provincias',
    flags: 'banderas',
    locations: 'lugares',
};

/** Hand-written Swedish SEO for published quizzes. */
const SV_OVERRIDES: Record<string, GameManifest['locales']['string']> = {
    'united-states-of-america-states': {
        title: 'USA-staterna Quiz - Testa din geografi | JordGlobe',
        description: 'Kan du placera alla 50 amerikanska delstater på kartan? Testa dina kunskaper på en interaktiv 3D-glob.',
        ogTitle: 'USA-staterna Quiz',
        ogDescription: 'Placera alla 50 amerikanska delstater på en interaktiv 3D-glob.',
    },
    'the-world-countries': {
        title: 'Världens länder Quiz - Testa din geografi | JordGlobe',
        description: 'Kan du placera alla länder i världen? Testa dina kunskaper på 198 länder på en interaktiv 3D-glob.',
        ogTitle: 'Världens länder Quiz',
        ogDescription: 'Placera alla länder i världen på en interaktiv 3D-glob.',
    },
    'the-world-flags': {
        title: 'Världens flaggor Quiz - Testa din geografi | JordGlobe',
        description: 'Kan du para ihop varje flagga med rätt land? Testa dina kunskaper på 198 flaggor på en interaktiv 3D-glob.',
        ogTitle: 'Världens flaggor Quiz',
        ogDescription: 'Para ihop varje flagga med rätt land på en interaktiv 3D-glob.',
    },
};

/** Hand-written German SEO for published quizzes. */
const DE_OVERRIDES: Record<string, GameManifest['locales']['string']> = {
    'united-states-of-america-states': {
        title: 'US-Bundesstaaten Quiz - Teste deine Geografie | JordGlobe',
        description: 'Kannst du alle 50 US-Bundesstaaten auf der Karte platzieren? Teste dein Wissen auf einem interaktiven 3D-Globus.',
        ogTitle: 'US-Bundesstaaten Quiz',
        ogDescription: 'Platziere alle 50 US-Bundesstaaten auf einem interaktiven 3D-Globus.',
    },
    'the-world-countries': {
        title: 'Länder der Welt Quiz - Teste deine Geografie | JordGlobe',
        description: 'Kannst du jedes Land der Welt platzieren? Teste dein Wissen über alle 198 Länder auf einem interaktiven 3D-Globus.',
        ogTitle: 'Länder der Welt Quiz',
        ogDescription: 'Platziere jedes Land der Welt auf einem interaktiven 3D-Globus.',
    },
    'the-world-flags': {
        title: 'Flaggen der Welt Quiz - Teste deine Geografie | JordGlobe',
        description: 'Kannst du jede Flagge dem richtigen Land zuordnen? Teste dein Wissen über alle 198 Flaggen auf einem interaktiven 3D-Globus.',
        ogTitle: 'Flaggen der Welt Quiz',
        ogDescription: 'Ordne jede Flagge ihrem Land auf einem interaktiven 3D-Globus zu.',
    },
};

/** Hand-written French SEO for published quizzes. */
const FR_OVERRIDES: Record<string, GameManifest['locales']['string']> = {
    'united-states-of-america-states': {
        title: 'Quiz des États américains - Teste ta géographie | JordGlobe',
        description: 'Peux-tu placer les 50 États américains sur la carte ? Mets tes connaissances à l\'épreuve sur un globe 3D interactif.',
        ogTitle: 'Quiz des États américains',
        ogDescription: 'Place les 50 États américains sur un globe 3D interactif.',
    },
    'the-world-countries': {
        title: 'Quiz des pays du monde - Teste ta géographie | JordGlobe',
        description: 'Peux-tu placer chaque pays du monde ? Mets à l\'épreuve tes connaissances des 198 pays sur un globe 3D interactif.',
        ogTitle: 'Quiz des pays du monde',
        ogDescription: 'Place chaque pays du monde sur un globe 3D interactif.',
    },
    'the-world-flags': {
        title: 'Quiz des drapeaux du monde - Teste ta géographie | JordGlobe',
        description: 'Peux-tu associer chaque drapeau à son pays ? Mets à l\'épreuve tes connaissances des 198 drapeaux sur un globe 3D interactif.',
        ogTitle: 'Quiz des drapeaux du monde',
        ogDescription: 'Associe chaque drapeau à son pays sur un globe 3D interactif.',
    },
};

/** Hand-written Italian SEO for published quizzes. */
const IT_OVERRIDES: Record<string, GameManifest['locales']['string']> = {
    'united-states-of-america-states': {
        title: 'Quiz degli Stati USA - Metti alla prova la tua geografia | JordGlobe',
        description: 'Riesci a posizionare tutti i 50 stati americani sulla mappa? Metti alla prova le tue conoscenze su un globo 3D interattivo.',
        ogTitle: 'Quiz degli Stati USA',
        ogDescription: 'Posiziona tutti i 50 stati americani su un globo 3D interattivo.',
    },
    'the-world-countries': {
        title: 'Quiz dei paesi del mondo - Metti alla prova la tua geografia | JordGlobe',
        description: 'Riesci a posizionare ogni paese del mondo? Metti alla prova le tue conoscenze su tutti i 198 paesi su un globo 3D interattivo.',
        ogTitle: 'Quiz dei paesi del mondo',
        ogDescription: 'Posiziona ogni paese del mondo su un globo 3D interattivo.',
    },
    'the-world-flags': {
        title: 'Quiz delle bandiere del mondo - Metti alla prova la tua geografia | JordGlobe',
        description: 'Riesci ad abbinare ogni bandiera al suo paese? Metti alla prova le tue conoscenze su tutte le 198 bandiere su un globo 3D interattivo.',
        ogTitle: 'Quiz delle bandiere del mondo',
        ogDescription: 'Abbina ogni bandiera al suo paese su un globo 3D interattivo.',
    },
};

/** Hand-written Polish SEO for published quizzes. */
const PL_OVERRIDES: Record<string, GameManifest['locales']['string']> = {
    'united-states-of-america-states': {
        title: 'Quiz stanów USA - Sprawdź swoją geografię | JordGlobe',
        description: 'Czy potrafisz umieścić wszystkie 50 stanów USA na mapie? Sprawdź swoją wiedzę na interaktywnym globusie 3D.',
        ogTitle: 'Quiz stanów USA',
        ogDescription: 'Umieść wszystkie 50 stanów USA na interaktywnym globusie 3D.',
    },
    'the-world-countries': {
        title: 'Quiz państw świata - Sprawdź swoją geografię | JordGlobe',
        description: 'Czy potrafisz umieścić każde państwo świata? Sprawdź swoją wiedzę o wszystkich 198 państwach na interaktywnym globusie 3D.',
        ogTitle: 'Quiz państw świata',
        ogDescription: 'Umieść każde państwo świata na interaktywnym globusie 3D.',
    },
    'the-world-flags': {
        title: 'Quiz flag świata - Sprawdź swoją geografię | JordGlobe',
        description: 'Czy potrafisz dopasować każdą flagę do jej państwa? Sprawdź swoją wiedzę o wszystkich 198 flagach na interaktywnym globusie 3D.',
        ogTitle: 'Quiz flag świata',
        ogDescription: 'Dopasuj każdą flagę do jej państwa na interaktywnym globusie 3D.',
    },
};

/** Hand-written Spanish SEO for published quizzes. */
const ES_OVERRIDES: Record<string, GameManifest['locales']['string']> = {
    'united-states-of-america-states': {
        title: 'Cuestionario de estados de EE. UU. - Pon a prueba tu geografía | JordGlobe',
        description: '¿Puedes colocar los 50 estados de EE. UU. en el mapa? Pon a prueba tus conocimientos en un globo 3D interactivo.',
        ogTitle: 'Cuestionario de estados de EE. UU.',
        ogDescription: 'Coloca los 50 estados de EE. UU. en un globo 3D interactivo.',
    },
    'the-world-countries': {
        title: 'Cuestionario de países del mundo - Pon a prueba tu geografía | JordGlobe',
        description: '¿Puedes colocar cada país del mundo? Pon a prueba tus conocimientos sobre los 198 países en un globo 3D interactivo.',
        ogTitle: 'Cuestionario de países del mundo',
        ogDescription: 'Coloca cada país del mundo en un globo 3D interactivo.',
    },
    'the-world-flags': {
        title: 'Cuestionario de banderas del mundo - Pon a prueba tu geografía | JordGlobe',
        description: '¿Puedes emparejar cada bandera con su país? Pon a prueba tus conocimientos sobre las 198 banderas en un globo 3D interactivo.',
        ogTitle: 'Cuestionario de banderas del mundo',
        ogDescription: 'Empareja cada bandera con su país en un globo 3D interactivo.',
    },
};

function seoForQuiz(quiz: QuizDef): GameManifest['locales'] {
    const count = quiz.questionIds.length;
    const typeLabel = TYPE_LABEL[quiz.type] || 'questions';
    const typeLabelDe = TYPE_LABEL_DE[quiz.type] || 'Fragen';
    const typeLabelFr = TYPE_LABEL_FR[quiz.type] || 'questions';
    const typeLabelIt = TYPE_LABEL_IT[quiz.type] || 'domande';
    const typeLabelPl = TYPE_LABEL_PL[quiz.type] || 'pytań';
    const typeLabelEs = TYPE_LABEL_ES[quiz.type] || 'preguntas';
    const slug = toSlug(quiz.name);
    const locales: GameManifest['locales'] = {
        en: {
            title: `${quiz.name} Quiz - Test Your Geography | JordGlobe`,
            description: `Can you identify all ${count} ${typeLabel} in this geography quiz? Test your knowledge of ${quiz.name.toLowerCase()} on an interactive 3D globe.`,
            ogTitle: `${quiz.name} Quiz`,
            ogDescription: `Test your knowledge of ${count} ${typeLabel} on an interactive 3D globe.`,
        },
    };
    const svOverride = SV_OVERRIDES[slug];
    if (svOverride) {
        locales.sv = svOverride;
    }
    const deOverride = DE_OVERRIDES[slug];
    if (deOverride) {
        locales.de = deOverride;
    } else {
        locales.de = {
            title: `${quiz.name} Quiz - Teste deine Geografie | JordGlobe`,
            description: `Kannst du alle ${count} ${typeLabelDe} in diesem Geografie-Quiz erkennen? Teste dein Wissen über ${quiz.name.toLowerCase()} auf einem interaktiven 3D-Globus.`,
            ogTitle: `${quiz.name} Quiz`,
            ogDescription: `Teste dein Wissen über ${count} ${typeLabelDe} auf einem interaktiven 3D-Globus.`,
        };
    }
    const frOverride = FR_OVERRIDES[slug];
    if (frOverride) {
        locales.fr = frOverride;
    } else {
        locales.fr = {
            title: `Quiz ${quiz.name} - Teste ta géographie | JordGlobe`,
            description: `Peux-tu identifier les ${count} ${typeLabelFr} de ce quiz de géographie ? Mets à l'épreuve tes connaissances de ${quiz.name.toLowerCase()} sur un globe 3D interactif.`,
            ogTitle: `Quiz ${quiz.name}`,
            ogDescription: `Mets à l'épreuve tes connaissances de ${count} ${typeLabelFr} sur un globe 3D interactif.`,
        };
    }
    const itOverride = IT_OVERRIDES[slug];
    if (itOverride) {
        locales.it = itOverride;
    } else {
        locales.it = {
            title: `Quiz ${quiz.name} - Metti alla prova la tua geografia | JordGlobe`,
            description: `Riesci a identificare tutti i ${count} ${typeLabelIt} in questo quiz di geografia? Metti alla prova le tue conoscenze di ${quiz.name.toLowerCase()} su un globo 3D interattivo.`,
            ogTitle: `Quiz ${quiz.name}`,
            ogDescription: `Metti alla prova le tue conoscenze di ${count} ${typeLabelIt} su un globo 3D interattivo.`,
        };
    }
    const plOverride = PL_OVERRIDES[slug];
    if (plOverride) {
        locales.pl = plOverride;
    } else {
        locales.pl = {
            title: `Quiz ${quiz.name} - Sprawdź swoją geografię | JordGlobe`,
            description: `Czy potrafisz rozpoznać wszystkie ${count} ${typeLabelPl} w tym quizie geograficznym? Sprawdź swoją wiedzę o ${quiz.name.toLowerCase()} na interaktywnym globusie 3D.`,
            ogTitle: `Quiz ${quiz.name}`,
            ogDescription: `Sprawdź swoją wiedzę o ${count} ${typeLabelPl} na interaktywnym globusie 3D.`,
        };
    }
    const esOverride = ES_OVERRIDES[slug];
    if (esOverride) {
        locales.es = esOverride;
    } else {
        locales.es = {
            title: `Cuestionario ${quiz.name} - Pon a prueba tu geografía | JordGlobe`,
            description: `¿Puedes identificar las ${count} ${typeLabelEs} de este cuestionario de geografía? Pon a prueba tus conocimientos sobre ${quiz.name.toLowerCase()} en un globo 3D interactivo.`,
            ogTitle: `Cuestionario ${quiz.name}`,
            ogDescription: `Pon a prueba tus conocimientos sobre ${count} ${typeLabelEs} en un globo 3D interactivo.`,
        };
    }
    return locales;
}

const quizzes = quizzesData.quizzes as QuizDef[];

/** Quizzes shown on the index page — only these are published to production. */
const publishedSlugs = new Set([
    'united-states-of-america-states',
    'the-world-countries',
    'the-world-flags',
]);

export const quizManifests: GameManifest[] = quizzes.map((quiz) => {
    const slug = toSlug(quiz.name);
    return {
        id: slug,
        published: publishedSlugs.has(slug),
        image: '/games/og-image.png',
        i18n: QUIZ_I18N,
        locales: seoForQuiz(quiz),
    };
});

export const quizBySlug = new Map<string, QuizDef>(
    quizzes.map((quiz) => [toSlug(quiz.name), quiz]),
);

// Verify no slug collisions at module load
if (quizBySlug.size !== quizzes.length) {
    const slugs = quizzes.map((q) => toSlug(q.name));
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    throw new Error(`Duplicate quiz slugs: ${[...new Set(dupes)].join(', ')}`);
}
