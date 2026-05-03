import type { QuizTranslations } from '../../shared/i18n/types';

export const DRONE_CITIES_I18N: QuizTranslations = {
    defaultLocale: 'en',
    availableLocales: [
        { code: 'en', label: 'English' },
        { code: 'sv', label: 'Svenska' },
    ],
    strings: {
        en: {
            'loading.title':    'Loading Drone Cities',
            'start.title':      'Drone Cities',
            'start.playButton': 'Play',
            'quiz.title':       'Drone Cities',
            'question.prompt':  'Which city is this?',
        },
        sv: {
            'loading.title':    'Laddar Drone Cities',
            'start.title':      'Drone Cities',
            'start.playButton': 'Spela',
            'quiz.title':       'Drone Cities',
            'question.prompt':  'Vilken stad är detta?',
        },
    },
};
