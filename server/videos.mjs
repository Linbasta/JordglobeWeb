/**
 * Eurovision 2026 Video Quiz
 *
 * Uses a single compilation video with timecodes to prevent
 * country names being revealed in individual video titles.
 *
 * Each question follows the solo quiz Question type:
 * - present: 'video'
 * - answer: 'location-guess'
 * - youtubeId, lat, lng, prompt, locationName, startTime, endTime
 */

// Single compilation video with all Eurovision 2026 entries
const COMPILATION_VIDEO_ID = '1jnR-m5u5yQ';

// Global offset: start this many seconds into each song (to skip intros)
const SONG_OFFSET = 12;

// Clip duration: how long each clip plays
const CLIP_DURATION = 10;

// Helper to parse "MM:SS" to seconds
function parseTime(timeStr) {
    const [min, sec] = timeStr.split(':').map(Number);
    return min * 60 + sec;
}

// [songStartTime, lat, lng, locationName]
// Timecodes from the Eurovision 2026 compilation video
const EUROVISION_ENTRIES = [
    ['00:00', 41.3275, 19.8187, 'Albania'],
    ['00:31', 40.1792, 44.4991, 'Armenia'],
    ['01:00', -35.2809, 149.1300, 'Australia'],
    ['01:29', 48.2082, 16.3738, 'Austria'],
    ['01:58', 40.4093, 49.8671, 'Azerbaijan'],
    ['02:25', 50.8503, 4.3517, 'Belgium'],
    ['02:53', 42.6977, 23.3219, 'Bulgaria'],
    ['03:24', 45.8150, 15.9819, 'Croatia'],
    ['03:55', 35.1856, 33.3823, 'Cyprus'],
    ['04:24', 50.0755, 14.4378, 'Czech Republic'],
    ['04:56', 55.6761, 12.5683, 'Denmark'],
    ['05:26', 59.4370, 24.7536, 'Estonia'],
    ['05:54', 60.1699, 24.9384, 'Finland'],
    ['06:26', 48.8566, 2.3522, 'France'],
    ['06:55', 41.7151, 44.8271, 'Georgia'],
    ['07:24', 52.5200, 13.4050, 'Germany'],
    ['07:56', 37.9838, 23.7275, 'Greece'],
    ['08:28', 31.7683, 35.2137, 'Israel'],
    ['08:59', 41.9028, 12.4964, 'Italy'],
    ['09:28', 56.9496, 24.1052, 'Latvia'],
    ['09:57', 54.6872, 25.2797, 'Lithuania'],
    ['10:29', 49.6117, 6.1300, 'Luxembourg'],
    ['11:03', 35.8989, 14.5146, 'Malta'],
    ['11:32', 47.0105, 28.8638, 'Moldova'],
    ['12:01', 42.4304, 19.2594, 'Montenegro'],
    ['12:31', 59.9139, 10.7522, 'Norway'],
    ['13:00', 52.2297, 21.0122, 'Poland'],
    ['13:30', 38.7223, -9.1393, 'Portugal'],
    ['13:58', 44.4268, 26.1025, 'Romania'],
    ['14:29', 43.9424, 12.4578, 'San Marino'],
    ['14:59', 44.7866, 20.4489, 'Serbia'],
    ['15:29', 59.3293, 18.0686, 'Sweden'],
    ['15:59', 46.9480, 7.4474, 'Switzerland'],
    ['16:28', 50.4501, 30.5234, 'Ukraine'],
    ['17:00', 51.5074, -0.1278, 'United Kingdom'],
];

export const videos = EUROVISION_ENTRIES.map(([timeStr, lat, lng, locationName]) => {
    const songStart = parseTime(timeStr);
    return {
        present: 'video',
        answer: 'location-guess',
        youtubeId: COMPILATION_VIDEO_ID,
        lat,
        lng,
        prompt: 'Which country does this song represent?',
        locationName,
        startTime: songStart + SONG_OFFSET,
        endTime: songStart + SONG_OFFSET + CLIP_DURATION,
        hideBottom: true,  // Hide country name overlay in compilation
    };
});

/**
 * Get a random video question
 */
export function getRandomVideo() {
    return videos[Math.floor(Math.random() * videos.length)];
}
