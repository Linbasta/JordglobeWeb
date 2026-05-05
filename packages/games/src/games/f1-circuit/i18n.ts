import type { QuizTranslations } from '../../shared/i18n/types';

export const F1_CIRCUIT_I18N: QuizTranslations = {
    defaultLocale: 'en',
    availableLocales: [
        { code: 'en', label: 'English' },
        { code: 'sv', label: 'Svenska' },
    ],
    strings: {
        en: {
            'loading.title':    'Loading F1 Circuits',
            'start.title':      'F1 Circuits',
            'start.playButton': 'Play',
            'quiz.title':       'F1 Circuits',
            'question.prompt':  'Where is this circuit?',
        },
        sv: {
            'loading.title':    'Laddar F1-banor',
            'start.title':      'F1-banor',
            'start.playButton': 'Spela',
            'quiz.title':       'F1-banor',
            'question.prompt':  'Var ligger den här banan?',
        },
    },
};
