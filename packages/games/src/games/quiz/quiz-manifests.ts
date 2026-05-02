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

function seoForQuiz(quiz: QuizDef): GameManifest['locales'] {
    const count = quiz.questionIds.length;
    const typeLabel = TYPE_LABEL[quiz.type] || 'questions';
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
