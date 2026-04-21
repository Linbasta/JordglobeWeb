import type { QuizTranslations } from '../shared/i18n/types';

export type LocaleSeo = {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
};

export type GameManifest = {
    id: string;
    published: boolean;
    /** OG image filename, relative to /games/[id]/ — e.g. 'og-euro-music-quiz.jpg' */
    image: string;
    i18n: QuizTranslations;
    locales: Record<string, LocaleSeo>;
};
