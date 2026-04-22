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

function seoForQuiz(quiz: QuizDef): GameManifest['locales'] {
    const count = quiz.questionIds.length;
    const typeLabel = TYPE_LABEL[quiz.type] || 'questions';
    return {
        en: {
            title: `${quiz.name} Quiz - Test Your Geography | JordGlobe`,
            description: `Can you identify all ${count} ${typeLabel} in this geography quiz? Test your knowledge of ${quiz.name.toLowerCase()} on an interactive 3D globe.`,
            ogTitle: `${quiz.name} Quiz`,
            ogDescription: `Test your knowledge of ${count} ${typeLabel} on an interactive 3D globe.`,
        },
    };
}

const quizzes = quizzesData.quizzes as QuizDef[];

export const quizManifests: GameManifest[] = quizzes.map((quiz) => ({
    id: toSlug(quiz.name),
    published: true,
    image: '/games/og-image.png',
    i18n: QUIZ_I18N,
    locales: seoForQuiz(quiz),
}));

export const quizBySlug = new Map<string, QuizDef>(
    quizzes.map((quiz) => [toSlug(quiz.name), quiz]),
);

// Verify no slug collisions at module load
if (quizBySlug.size !== quizzes.length) {
    const slugs = quizzes.map((q) => toSlug(q.name));
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    throw new Error(`Duplicate quiz slugs: ${[...new Set(dupes)].join(', ')}`);
}
