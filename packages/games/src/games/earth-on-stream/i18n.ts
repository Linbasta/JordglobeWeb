import type { QuizTranslations } from '../../shared/i18n/types';

export const EARTH_ON_STREAM_I18N: QuizTranslations = {
    defaultLocale: 'en',
    availableLocales: [
        { code: 'en', label: 'English' },
        { code: 'sv', label: 'Svenska' },
    ],
    strings: {
        en: {
            'loading.title': 'Earth on Stream',
            'game.found': 'found',
            'game.complete': 'Round Complete!',
            'game.playAgain': 'Play Again',
            'input.placeholder': 'Type your guess...',
            'twitch.connect': 'Connect to Twitch',
            'twitch.connected': 'Connected',
            'twitch.disconnect': 'Disconnect',
            'twitch.connecting': 'Connecting...',
            'twitch.error': 'Connection failed',
        },
        sv: {
            'loading.title': 'Earth on Stream',
            'game.found': 'hittade',
            'game.complete': 'Omgång klar!',
            'game.playAgain': 'Spela igen',
            'input.placeholder': 'Skriv din gissning...',
            'twitch.connect': 'Anslut till Twitch',
            'twitch.connected': 'Ansluten',
            'twitch.disconnect': 'Koppla från',
            'twitch.connecting': 'Ansluter...',
            'twitch.error': 'Anslutning misslyckades',
        },
    },
};
