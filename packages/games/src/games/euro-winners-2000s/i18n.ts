import type { QuizTranslations } from '../../shared/i18n/types';

export const EURO_WINNERS_2000S_I18N: QuizTranslations = {
    defaultLocale: 'en',
    availableLocales: [
        { code: 'en', label: 'English' },
        { code: 'sv', label: 'Svenska' },
    ],
    strings: {
        en: {
            'loading.title':    'Loading Euro Music Winners',
            'start.title':      'Euro Music Winners 2000-2025',
            'start.playButton': 'Play',
            'quiz.title':       'Euro Music Winners 2000-2025',
            'question.prompt':  '{year} winner — which country?',
            'sprite.0':         'Nul Points',
            'sprite.1':         'Mildly Aware',
            'sprite.2':         'Semi-Curious',
            'sprite.3':         'Music Lover',
            'sprite.4':         'Devoted Fan',
            'sprite.5':         'Music God',
        },
        sv: {
            'loading.title':    'Laddar Euro Music-vinnare',
            'start.title':      'Euro Music-vinnare 2000–2025',
            'start.playButton': 'Spela',
            'quiz.title':       'Euro Music-vinnare 2000–2025',
            'question.prompt':  'Vinnaren {year} — vilket land?',
            'sprite.0':         'Noll poäng',
            'sprite.1':         'Lätt förvirrad',
            'sprite.2':         'Nyfiken',
            'sprite.3':         'Musikälskare',
            'sprite.4':         'Hängiven fan',
            'sprite.5':         'Musikgud',
        },
    },
};
