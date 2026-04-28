import type { QuizTranslations } from '../../shared/i18n/types';

export const GAME_QUIZ_I18N: QuizTranslations = {
    defaultLocale: 'en',
    availableLocales: [
        { code: 'en', label: 'English' },
        { code: 'sv', label: 'Svenska' },
    ],
    strings: {
        en: {
            'loading.title':    'Loading Video Game Origins',
            'start.title':      'Video Game Origins',
            'start.playButton': 'Play',
            'quiz.title':       'Video Game Origins',
            'question.prompt':  'Which country created this game?',
            'sprite.0':         'Game Over',
            'sprite.1':         'Casual Player',
            'sprite.2':         'Console Curious',
            'sprite.3':         'Gamer',
            'sprite.4':         'Hardcore',
            'sprite.5':         'Speedrunner',
        },
        sv: {
            'loading.title':    'Laddar Datorspelens ursprung',
            'start.title':      'Datorspelens ursprung',
            'start.playButton': 'Spela',
            'quiz.title':       'Datorspelens ursprung',
            'question.prompt':  'Vilket land skapade detta spel?',
            'sprite.0':         'Game Over',
            'sprite.1':         'Soffspelare',
            'sprite.2':         'Konsolnyfiken',
            'sprite.3':         'Gamer',
            'sprite.4':         'Hardcore',
            'sprite.5':         'Speedrunner',
        },
    },
};
