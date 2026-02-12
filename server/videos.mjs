/**
 * Viral Video Quiz - 7 Legendary Videos
 *
 * Each question follows the solo quiz Question type:
 * - present: 'video'
 * - answer: 'location-guess'
 * - youtubeId, lat, lng, prompt, locationName, startTime, endTime
 *
 * Geographic diversity: Asia, Africa, Europe, North America, Latin America
 */

export const videos = [
    // 1. Gangnam Style - The video that broke YouTube
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: '9bZkp7q19f0',
        lat: 37.5172,
        lng: 127.0473,
        prompt: 'Where was this viral dance phenomenon filmed?',
        locationName: 'Gangnam, Seoul, South Korea',
        startTime: 30,
        endTime: 60
    },

    // 2. Despacito - Most viewed video ever
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'kJQP7kiw5Fk',
        lat: 18.4655,
        lng: -66.1057,
        prompt: 'Where was this record-breaking music video filmed?',
        locationName: 'San Juan, Puerto Rico',
        startTime: 0,
        endTime: 30
    },

    // 3. Rebecca Black - Friday (infamous viral sensation)
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'kfVsfOSbJY0',
        lat: 34.0522,
        lng: -118.2437,
        prompt: 'Where was this infamous viral video filmed?',
        locationName: 'Los Angeles, California, USA',
        startTime: 30,
        endTime: 60
    },

    // 4. Double Rainbow - "What does it mean?!"
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'OQSNhk5ICTI',
        lat: 37.7459,
        lng: -119.5933,
        prompt: 'Where was this emotional rainbow moment filmed?',
        locationName: 'Yosemite National Park, California, USA',
        startTime: 0,
        endTime: 30
    },

    // 5. Never Gonna Give You Up - The legendary Rickroll
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'dQw4w9WgXcQ',
        lat: 51.5074,
        lng: -0.1278,
        prompt: 'Where was this legendary internet meme filmed?',
        locationName: 'London, United Kingdom',
        startTime: 0,
        endTime: 30
    },

    // 6. Viral video from Uganda
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'LRmALdMJxoU',
        lat: -0.3476,
        lng: 31.7347,
        prompt: 'Where is this viral video from?',
        locationName: 'Masaka, Uganda',
        startTime: 0,
        endTime: 30
    },

    // 7. Viral video from Hong Kong
    {
        present: 'video',
        answer: 'location-guess',
        youtubeId: 'nFo_NjgwJbQ',
        lat: 22.3193,
        lng: 114.1694,
        prompt: 'Where is this viral video from?',
        locationName: 'Hong Kong',
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
