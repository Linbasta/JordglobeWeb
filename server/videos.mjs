/**
 * Video Questions for Party Game
 *
 * Each question follows the solo quiz Question type:
 * - present: 'video'
 * - answer: 'location-guess'
 * - youtubeId, lat, lng, prompt, locationName, startTime, endTime
 *
 * NOTE: When using sequential order (randomOrder: false in server config),
 * these videos will be shown in the order they appear in this array.
 */

export const videos = [
    // Music Videos - Iconic Locations
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'dQw4w9WgXcQ',
        lat: 51.5074,
        lng: -0.1278,
        prompt: 'Where was this music video filmed?',
        locationName: 'London',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'JGwWNGJdvx8',
        lat: 37.5665,
        lng: 126.9780,
        prompt: 'Where is this K-pop song from?',
        locationName: 'Seoul',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'kJQP7kiw5Fk',
        lat: 6.2476,
        lng: -75.5658,
        prompt: 'Where was this music video filmed?',
        locationName: 'Medellín',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: '60ItHLz5WEA',
        lat: 48.8566,
        lng: 2.3522,
        prompt: 'Where was this music video filmed?',
        locationName: 'Paris',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'RgKAFK5djSk',
        lat: -22.9068,
        lng: -43.1729,
        prompt: 'Where was this music video filmed?',
        locationName: 'Rio de Janeiro',
        startTime: 0,
        endTime: 30
    },

    // Travel & City Videos
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'TLV4_xaYynY',
        lat: 35.6762,
        lng: 139.6503,
        prompt: 'Which city is featured in this video?',
        locationName: 'Tokyo',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'BrlF46M8h-w',
        lat: 40.7128,
        lng: -74.0060,
        prompt: 'Which city is this?',
        locationName: 'New York',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'EQ8ViYIeH04',
        lat: 25.2048,
        lng: 55.2708,
        prompt: 'Where is this place?',
        locationName: 'Dubai',
        startTime: 0,
        endTime: 30
    },

    // Landmarks & Nature
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: '4zdl8TvYBjw',
        lat: -13.1631,
        lng: -72.5450,
        prompt: 'Where is this landmark?',
        locationName: 'Machu Picchu',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'MLYt_qWqzhg',
        lat: 29.9792,
        lng: 31.1342,
        prompt: 'Where is this ancient site?',
        locationName: 'Pyramids of Giza',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'LzVL3Vc6UWs',
        lat: -25.3444,
        lng: 131.0369,
        prompt: 'Where is this natural landmark?',
        locationName: 'Uluru',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'D1ZYhVpdXbQ',
        lat: 36.1069,
        lng: -112.1129,
        prompt: 'Where is this natural wonder?',
        locationName: 'Grand Canyon',
        startTime: 0,
        endTime: 30
    },

    // European Cities
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'QfSP9p7vF4w',
        lat: 41.9028,
        lng: 12.4964,
        prompt: 'Which ancient city is this?',
        locationName: 'Rome',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'dXjf3sKG4Oo',
        lat: 41.3851,
        lng: 2.1734,
        prompt: 'Which European city is this?',
        locationName: 'Barcelona',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'zXiDFKHAYvM',
        lat: 52.3676,
        lng: 4.9041,
        prompt: 'Which city is known for its canals?',
        locationName: 'Amsterdam',
        startTime: 0,
        endTime: 30
    },

    // Asian Cities
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'HtwPvKSHyJ0',
        lat: 22.3193,
        lng: 114.1694,
        prompt: 'Which vibrant Asian city is this?',
        locationName: 'Hong Kong',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'Zy86_qvvxKI',
        lat: 1.3521,
        lng: 103.8198,
        prompt: 'Which modern city-state is this?',
        locationName: 'Singapore',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'C_iaqKWFIrE',
        lat: 13.7563,
        lng: 100.5018,
        prompt: 'Which Southeast Asian capital is this?',
        locationName: 'Bangkok',
        startTime: 0,
        endTime: 30
    },

    // Exotic Locations
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'BQ5ax8im3Ow',
        lat: 64.1466,
        lng: -21.9426,
        prompt: 'Where is this Nordic capital?',
        locationName: 'Reykjavik',
        startTime: 0,
        endTime: 30
    },
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'SXiSVQZLje8',
        lat: -33.8688,
        lng: 151.2093,
        prompt: 'Which harbor city is this?',
        locationName: 'Sydney',
        startTime: 0,
        endTime: 30
    }
];

/**
 * Get a random video question
 */
export function getRandomVideo() {
    return videos[Math.floor(Math.random() * videos.length)];
}
