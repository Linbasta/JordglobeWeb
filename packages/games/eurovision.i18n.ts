import type { QuizTranslations } from './src/shared/i18n/types'

export const EUROVISION_I18N: QuizTranslations = {
    defaultLocale: 'en',
    availableLocales: [
        { code: 'en', label: 'English' },
        { code: 'sv', label: 'Svenska' },
    ],
    strings: {
        en: {
            'loading.title':    'Loading Eurovision Quiz',
            'start.title':      'Euro Music Quiz 2026',
            'start.playButton': 'Play',
            'quiz.title':       'Eurovision Quiz',
            'question.prompt':  'This entry is from which country?',
            'sprite.0':         'Nul Points',
            'sprite.1':         'Mildly Aware',
            'sprite.2':         'Semi-Curious',
            'sprite.3':         'Eurovision Lover',
            'sprite.4':         'Devoted Fan',
            'sprite.5':         'Eurovision God',
        },
        sv: {
            'loading.title':    'Laddar Eurovision-quizet',
            'start.title':      'Euro Music Quiz 2026',
            'start.playButton': 'Spela',
            'quiz.title':       'Eurovision-quiz',
            'question.prompt':  'Från vilket land kommer detta bidrag?',
            'sprite.0':         'Noll poäng',
            'sprite.1':         'Lätt förvirrad',
            'sprite.2':         'Nyfiken',
            'sprite.3':         'Eurovision-älskare',
            'sprite.4':         'Hängiven fan',
            'sprite.5':         'Eurovision-gud',
        },
    },
}
