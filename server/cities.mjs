/**
 * 200 Famous Cities of the World
 * Each city follows the solo quiz Question type for location-guess with text presentation:
 * - present: 'text'
 * - answer: 'location-guess'
 * - prompt: city name
 * - lat, lng (note: 'lng' not 'lon' for consistency with solo game)
 * - locationName: full name with country
 */

export const cities = [
    // Europe
    { present: 'text', answer: 'location-guess', prompt: "London", lat: 51.5074, lng: -0.1278, locationName: "London, UK" },
    { present: 'text', answer: 'location-guess', prompt: "Paris", lat: 48.8566, lng: 2.3522, locationName: "Paris, France" },
    { present: 'text', answer: 'location-guess', prompt: "Rome", lat: 41.9028, lng: 12.4964, locationName: "Rome, Italy" },
    { present: 'text', answer: 'location-guess', prompt: "Berlin", lat: 52.5200, lng: 13.4050, locationName: "Berlin, Germany" },
    { present: 'text', answer: 'location-guess', prompt: "Madrid", lat: 40.4168, lng: -3.7038, locationName: "Madrid, Spain" },
    { present: 'text', answer: 'location-guess', prompt: "Amsterdam", lat: 52.3676, lng: 4.9041, locationName: "Amsterdam, Netherlands" },
    { present: 'text', answer: 'location-guess', prompt: "Vienna", lat: 48.2082, lng: 16.3738, locationName: "Vienna, Austria" },
    { present: 'text', answer: 'location-guess', prompt: "Prague", lat: 50.0755, lng: 14.4378, locationName: "Prague, Czech Republic" },
    { present: 'text', answer: 'location-guess', prompt: "Barcelona", lat: 41.3851, lng: 2.1734, locationName: "Barcelona, Spain" },
    { present: 'text', answer: 'location-guess', prompt: "Munich", lat: 48.1351, lng: 11.5820, locationName: "Munich, Germany" },
    { present: 'text', answer: 'location-guess', prompt: "Milan", lat: 45.4642, lng: 9.1900, locationName: "Milan, Italy" },
    { present: 'text', answer: 'location-guess', prompt: "Stockholm", lat: 59.3293, lng: 18.0686, locationName: "Stockholm, Sweden" },
    { present: 'text', answer: 'location-guess', prompt: "Copenhagen", lat: 55.6761, lng: 12.5683, locationName: "Copenhagen, Denmark" },
    { present: 'text', answer: 'location-guess', prompt: "Dublin", lat: 53.3498, lng: -6.2603, locationName: "Dublin, Ireland" },
    { present: 'text', answer: 'location-guess', prompt: "Brussels", lat: 50.8503, lng: 4.3517, locationName: "Brussels, Belgium" },
    { present: 'text', answer: 'location-guess', prompt: "Lisbon", lat: 38.7223, lng: -9.1393, locationName: "Lisbon, Portugal" },
    { present: 'text', answer: 'location-guess', prompt: "Athens", lat: 37.9838, lng: 23.7275, locationName: "Athens, Greece" },
    { present: 'text', answer: 'location-guess', prompt: "Budapest", lat: 47.4979, lng: 19.0402, locationName: "Budapest, Hungary" },
    { present: 'text', answer: 'location-guess', prompt: "Warsaw", lat: 52.2297, lng: 21.0122, locationName: "Warsaw, Poland" },
    { present: 'text', answer: 'location-guess', prompt: "Oslo", lat: 59.9139, lng: 10.7522, locationName: "Oslo, Norway" },
    { present: 'text', answer: 'location-guess', prompt: "Helsinki", lat: 60.1699, lng: 24.9384, locationName: "Helsinki, Finland" },
    { present: 'text', answer: 'location-guess', prompt: "Zurich", lat: 47.3769, lng: 8.5417, locationName: "Zurich, Switzerland" },
    { present: 'text', answer: 'location-guess', prompt: "Geneva", lat: 46.2044, lng: 6.1432, locationName: "Geneva, Switzerland" },
    { present: 'text', answer: 'location-guess', prompt: "Venice", lat: 45.4408, lng: 12.3155, locationName: "Venice, Italy" },
    { present: 'text', answer: 'location-guess', prompt: "Florence", lat: 43.7696, lng: 11.2558, locationName: "Florence, Italy" },
    { present: 'text', answer: 'location-guess', prompt: "Edinburgh", lat: 55.9533, lng: -3.1883, locationName: "Edinburgh, UK" },
    { present: 'text', answer: 'location-guess', prompt: "Reykjavik", lat: 64.1466, lng: -21.9426, locationName: "Reykjavik, Iceland" },
    { present: 'text', answer: 'location-guess', prompt: "Monaco", lat: 43.7384, lng: 7.4246, locationName: "Monaco, Monaco" },
    { present: 'text', answer: 'location-guess', prompt: "Krakow", lat: 50.0647, lng: 19.9450, locationName: "Krakow, Poland" },
    { present: 'text', answer: 'location-guess', prompt: "Istanbul", lat: 41.0082, lng: 28.9784, locationName: "Istanbul, Turkey" },

    // Asia
    { present: 'text', answer: 'location-guess', prompt: "Tokyo", lat: 35.6762, lng: 139.6503, locationName: "Tokyo, Japan" },
    { present: 'text', answer: 'location-guess', prompt: "Beijing", lat: 39.9042, lng: 116.4074, locationName: "Beijing, China" },
    { present: 'text', answer: 'location-guess', prompt: "Shanghai", lat: 31.2304, lng: 121.4737, locationName: "Shanghai, China" },
    { present: 'text', answer: 'location-guess', prompt: "Hong Kong", lat: 22.3193, lng: 114.1694, locationName: "Hong Kong, China" },
    { present: 'text', answer: 'location-guess', prompt: "Singapore", lat: 1.3521, lng: 103.8198, locationName: "Singapore, Singapore" },
    { present: 'text', answer: 'location-guess', prompt: "Seoul", lat: 37.5665, lng: 126.9780, locationName: "Seoul, South Korea" },
    { present: 'text', answer: 'location-guess', prompt: "Bangkok", lat: 13.7563, lng: 100.5018, locationName: "Bangkok, Thailand" },
    { present: 'text', answer: 'location-guess', prompt: "Mumbai", lat: 19.0760, lng: 72.8777, locationName: "Mumbai, India" },
    { present: 'text', answer: 'location-guess', prompt: "Delhi", lat: 28.7041, lng: 77.1025, locationName: "Delhi, India" },
    { present: 'text', answer: 'location-guess', prompt: "Dubai", lat: 25.2048, lng: 55.2708, locationName: "Dubai, UAE" },
    { present: 'text', answer: 'location-guess', prompt: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, locationName: "Kuala Lumpur, Malaysia" },
    { present: 'text', answer: 'location-guess', prompt: "Taipei", lat: 25.0330, lng: 121.5654, locationName: "Taipei, Taiwan" },
    { present: 'text', answer: 'location-guess', prompt: "Jakarta", lat: -6.2088, lng: 106.8456, locationName: "Jakarta, Indonesia" },
    { present: 'text', answer: 'location-guess', prompt: "Manila", lat: 14.5995, lng: 120.9842, locationName: "Manila, Philippines" },
    { present: 'text', answer: 'location-guess', prompt: "Hanoi", lat: 21.0278, lng: 105.8342, locationName: "Hanoi, Vietnam" },
    { present: 'text', answer: 'location-guess', prompt: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297, locationName: "Ho Chi Minh City, Vietnam" },
    { present: 'text', answer: 'location-guess', prompt: "Osaka", lat: 34.6937, lng: 135.5023, locationName: "Osaka, Japan" },
    { present: 'text', answer: 'location-guess', prompt: "Kyoto", lat: 35.0116, lng: 135.7681, locationName: "Kyoto, Japan" },
    { present: 'text', answer: 'location-guess', prompt: "Bangalore", lat: 12.9716, lng: 77.5946, locationName: "Bangalore, India" },
    { present: 'text', answer: 'location-guess', prompt: "Chennai", lat: 13.0827, lng: 80.2707, locationName: "Chennai, India" },
    { present: 'text', answer: 'location-guess', prompt: "Kolkata", lat: 22.5726, lng: 88.3639, locationName: "Kolkata, India" },
    { present: 'text', answer: 'location-guess', prompt: "Shenzhen", lat: 22.5431, lng: 114.0579, locationName: "Shenzhen, China" },
    { present: 'text', answer: 'location-guess', prompt: "Guangzhou", lat: 23.1291, lng: 113.2644, locationName: "Guangzhou, China" },
    { present: 'text', answer: 'location-guess', prompt: "Chengdu", lat: 30.5728, lng: 104.0668, locationName: "Chengdu, China" },
    { present: 'text', answer: 'location-guess', prompt: "Busan", lat: 35.1796, lng: 129.0756, locationName: "Busan, South Korea" },
    { present: 'text', answer: 'location-guess', prompt: "Phuket", lat: 7.8804, lng: 98.3923, locationName: "Phuket, Thailand" },
    { present: 'text', answer: 'location-guess', prompt: "Bali", lat: -8.3405, lng: 115.0920, locationName: "Bali, Indonesia" },
    { present: 'text', answer: 'location-guess', prompt: "Kathmandu", lat: 27.7172, lng: 85.3240, locationName: "Kathmandu, Nepal" },
    { present: 'text', answer: 'location-guess', prompt: "Colombo", lat: 6.9271, lng: 79.8612, locationName: "Colombo, Sri Lanka" },
    { present: 'text', answer: 'location-guess', prompt: "Maldives", lat: 3.2028, lng: 73.2207, locationName: "Maldives, Maldives" },

    // Middle East
    { present: 'text', answer: 'location-guess', prompt: "Jerusalem", lat: 31.7683, lng: 35.2137, locationName: "Jerusalem, Israel" },
    { present: 'text', answer: 'location-guess', prompt: "Tel Aviv", lat: 32.0853, lng: 34.7818, locationName: "Tel Aviv, Israel" },
    { present: 'text', answer: 'location-guess', prompt: "Doha", lat: 25.2854, lng: 51.5310, locationName: "Doha, Qatar" },
    { present: 'text', answer: 'location-guess', prompt: "Abu Dhabi", lat: 24.4539, lng: 54.3773, locationName: "Abu Dhabi, UAE" },
    { present: 'text', answer: 'location-guess', prompt: "Riyadh", lat: 24.7136, lng: 46.6753, locationName: "Riyadh, Saudi Arabia" },
    { present: 'text', answer: 'location-guess', prompt: "Muscat", lat: 23.5880, lng: 58.3829, locationName: "Muscat, Oman" },
    { present: 'text', answer: 'location-guess', prompt: "Amman", lat: 31.9454, lng: 35.9284, locationName: "Amman, Jordan" },
    { present: 'text', answer: 'location-guess', prompt: "Beirut", lat: 33.8938, lng: 35.5018, locationName: "Beirut, Lebanon" },
    { present: 'text', answer: 'location-guess', prompt: "Tehran", lat: 35.6892, lng: 51.3890, locationName: "Tehran, Iran" },

    // Africa
    { present: 'text', answer: 'location-guess', prompt: "Cairo", lat: 30.0444, lng: 31.2357, locationName: "Cairo, Egypt" },
    { present: 'text', answer: 'location-guess', prompt: "Cape Town", lat: -33.9249, lng: 18.4241, locationName: "Cape Town, South Africa" },
    { present: 'text', answer: 'location-guess', prompt: "Johannesburg", lat: -26.2041, lng: 28.0473, locationName: "Johannesburg, South Africa" },
    { present: 'text', answer: 'location-guess', prompt: "Marrakech", lat: 31.6295, lng: -7.9811, locationName: "Marrakech, Morocco" },
    { present: 'text', answer: 'location-guess', prompt: "Casablanca", lat: 33.5731, lng: -7.5898, locationName: "Casablanca, Morocco" },
    { present: 'text', answer: 'location-guess', prompt: "Nairobi", lat: -1.2921, lng: 36.8219, locationName: "Nairobi, Kenya" },
    { present: 'text', answer: 'location-guess', prompt: "Lagos", lat: 6.5244, lng: 3.3792, locationName: "Lagos, Nigeria" },
    { present: 'text', answer: 'location-guess', prompt: "Accra", lat: 5.6037, lng: -0.1870, locationName: "Accra, Ghana" },
    { present: 'text', answer: 'location-guess', prompt: "Addis Ababa", lat: 8.9806, lng: 38.7578, locationName: "Addis Ababa, Ethiopia" },
    { present: 'text', answer: 'location-guess', prompt: "Tunis", lat: 36.8065, lng: 10.1815, locationName: "Tunis, Tunisia" },
    { present: 'text', answer: 'location-guess', prompt: "Algiers", lat: 36.7538, lng: 3.0588, locationName: "Algiers, Algeria" },
    { present: 'text', answer: 'location-guess', prompt: "Dakar", lat: 14.7167, lng: -17.4677, locationName: "Dakar, Senegal" },
    { present: 'text', answer: 'location-guess', prompt: "Zanzibar", lat: -6.1659, lng: 39.2026, locationName: "Zanzibar, Tanzania" },
    { present: 'text', answer: 'location-guess', prompt: "Victoria Falls", lat: -17.9243, lng: 25.8572, locationName: "Victoria Falls, Zimbabwe" },
    { present: 'text', answer: 'location-guess', prompt: "Luxor", lat: 25.6872, lng: 32.6396, locationName: "Luxor, Egypt" },

    // North America
    { present: 'text', answer: 'location-guess', prompt: "New York", lat: 40.7128, lng: -74.0060, locationName: "New York, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Los Angeles", lat: 34.0522, lng: -118.2437, locationName: "Los Angeles, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Chicago", lat: 41.8781, lng: -87.6298, locationName: "Chicago, USA" },
    { present: 'text', answer: 'location-guess', prompt: "San Francisco", lat: 37.7749, lng: -122.4194, locationName: "San Francisco, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Las Vegas", lat: 36.1699, lng: -115.1398, locationName: "Las Vegas, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Miami", lat: 25.7617, lng: -80.1918, locationName: "Miami, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Washington D.C.", lat: 38.9072, lng: -77.0369, locationName: "Washington D.C., USA" },
    { present: 'text', answer: 'location-guess', prompt: "Boston", lat: 42.3601, lng: -71.0589, locationName: "Boston, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Seattle", lat: 47.6062, lng: -122.3321, locationName: "Seattle, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Denver", lat: 39.7392, lng: -104.9903, locationName: "Denver, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Nashville", lat: 36.1627, lng: -86.7816, locationName: "Nashville, USA" },
    { present: 'text', answer: 'location-guess', prompt: "New Orleans", lat: 29.9511, lng: -90.0715, locationName: "New Orleans, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Austin", lat: 30.2672, lng: -97.7431, locationName: "Austin, USA" },
    { present: 'text', answer: 'location-guess', prompt: "San Diego", lat: 32.7157, lng: -117.1611, locationName: "San Diego, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Philadelphia", lat: 39.9526, lng: -75.1652, locationName: "Philadelphia, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Phoenix", lat: 33.4484, lng: -112.0740, locationName: "Phoenix, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Dallas", lat: 32.7767, lng: -96.7970, locationName: "Dallas, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Houston", lat: 29.7604, lng: -95.3698, locationName: "Houston, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Atlanta", lat: 33.7490, lng: -84.3880, locationName: "Atlanta, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Orlando", lat: 28.5383, lng: -81.3792, locationName: "Orlando, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Honolulu", lat: 21.3069, lng: -157.8583, locationName: "Honolulu, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Toronto", lat: 43.6532, lng: -79.3832, locationName: "Toronto, Canada" },
    { present: 'text', answer: 'location-guess', prompt: "Vancouver", lat: 49.2827, lng: -123.1207, locationName: "Vancouver, Canada" },
    { present: 'text', answer: 'location-guess', prompt: "Montreal", lat: 45.5017, lng: -73.5673, locationName: "Montreal, Canada" },
    { present: 'text', answer: 'location-guess', prompt: "Mexico City", lat: 19.4326, lng: -99.1332, locationName: "Mexico City, Mexico" },
    { present: 'text', answer: 'location-guess', prompt: "Cancun", lat: 21.1619, lng: -86.8515, locationName: "Cancun, Mexico" },
    { present: 'text', answer: 'location-guess', prompt: "Havana", lat: 23.1136, lng: -82.3666, locationName: "Havana, Cuba" },
    { present: 'text', answer: 'location-guess', prompt: "Nassau", lat: 25.0480, lng: -77.3554, locationName: "Nassau, Bahamas" },
    { present: 'text', answer: 'location-guess', prompt: "San Juan", lat: 18.4655, lng: -66.1057, locationName: "San Juan, Puerto Rico" },
    { present: 'text', answer: 'location-guess', prompt: "Jamaica", lat: 18.1096, lng: -77.2975, locationName: "Jamaica, Jamaica" },

    // South America
    { present: 'text', answer: 'location-guess', prompt: "Rio de Janeiro", lat: -22.9068, lng: -43.1729, locationName: "Rio de Janeiro, Brazil" },
    { present: 'text', answer: 'location-guess', prompt: "Sao Paulo", lat: -23.5505, lng: -46.6333, locationName: "Sao Paulo, Brazil" },
    { present: 'text', answer: 'location-guess', prompt: "Buenos Aires", lat: -34.6037, lng: -58.3816, locationName: "Buenos Aires, Argentina" },
    { present: 'text', answer: 'location-guess', prompt: "Lima", lat: -12.0464, lng: -77.0428, locationName: "Lima, Peru" },
    { present: 'text', answer: 'location-guess', prompt: "Bogota", lat: 4.7110, lng: -74.0721, locationName: "Bogota, Colombia" },
    { present: 'text', answer: 'location-guess', prompt: "Santiago", lat: -33.4489, lng: -70.6693, locationName: "Santiago, Chile" },
    { present: 'text', answer: 'location-guess', prompt: "Cusco", lat: -13.5319, lng: -71.9675, locationName: "Cusco, Peru" },
    { present: 'text', answer: 'location-guess', prompt: "Machu Picchu", lat: -13.1631, lng: -72.5450, locationName: "Machu Picchu, Peru" },
    { present: 'text', answer: 'location-guess', prompt: "Cartagena", lat: 10.3910, lng: -75.4794, locationName: "Cartagena, Colombia" },
    { present: 'text', answer: 'location-guess', prompt: "Medellin", lat: 6.2476, lng: -75.5658, locationName: "Medellin, Colombia" },
    { present: 'text', answer: 'location-guess', prompt: "Quito", lat: -0.1807, lng: -78.4678, locationName: "Quito, Ecuador" },
    { present: 'text', answer: 'location-guess', prompt: "Montevideo", lat: -34.9011, lng: -56.1645, locationName: "Montevideo, Uruguay" },
    { present: 'text', answer: 'location-guess', prompt: "La Paz", lat: -16.4897, lng: -68.1193, locationName: "La Paz, Bolivia" },
    { present: 'text', answer: 'location-guess', prompt: "Galapagos Islands", lat: -0.9538, lng: -90.9656, locationName: "Galapagos Islands, Ecuador" },

    // Oceania
    { present: 'text', answer: 'location-guess', prompt: "Sydney", lat: -33.8688, lng: 151.2093, locationName: "Sydney, Australia" },
    { present: 'text', answer: 'location-guess', prompt: "Melbourne", lat: -37.8136, lng: 144.9631, locationName: "Melbourne, Australia" },
    { present: 'text', answer: 'location-guess', prompt: "Brisbane", lat: -27.4698, lng: 153.0251, locationName: "Brisbane, Australia" },
    { present: 'text', answer: 'location-guess', prompt: "Perth", lat: -31.9505, lng: 115.8605, locationName: "Perth, Australia" },
    { present: 'text', answer: 'location-guess', prompt: "Auckland", lat: -36.8509, lng: 174.7645, locationName: "Auckland, New Zealand" },
    { present: 'text', answer: 'location-guess', prompt: "Wellington", lat: -41.2865, lng: 174.7762, locationName: "Wellington, New Zealand" },
    { present: 'text', answer: 'location-guess', prompt: "Queenstown", lat: -45.0312, lng: 168.6626, locationName: "Queenstown, New Zealand" },
    { present: 'text', answer: 'location-guess', prompt: "Fiji", lat: -17.7134, lng: 178.0650, locationName: "Fiji, Fiji" },
    { present: 'text', answer: 'location-guess', prompt: "Tahiti", lat: -17.6509, lng: -149.4260, locationName: "Tahiti, French Polynesia" },
    { present: 'text', answer: 'location-guess', prompt: "Gold Coast", lat: -28.0167, lng: 153.4000, locationName: "Gold Coast, Australia" },

    // Russia & Central Asia
    { present: 'text', answer: 'location-guess', prompt: "Moscow", lat: 55.7558, lng: 37.6173, locationName: "Moscow, Russia" },
    { present: 'text', answer: 'location-guess', prompt: "St. Petersburg", lat: 59.9311, lng: 30.3609, locationName: "St. Petersburg, Russia" },
    { present: 'text', answer: 'location-guess', prompt: "Almaty", lat: 43.2220, lng: 76.8512, locationName: "Almaty, Kazakhstan" },
    { present: 'text', answer: 'location-guess', prompt: "Tashkent", lat: 41.2995, lng: 69.2401, locationName: "Tashkent, Uzbekistan" },
    { present: 'text', answer: 'location-guess', prompt: "Samarkand", lat: 39.6270, lng: 66.9750, locationName: "Samarkand, Uzbekistan" },
    { present: 'text', answer: 'location-guess', prompt: "Tbilisi", lat: 41.7151, lng: 44.8271, locationName: "Tbilisi, Georgia" },
    { present: 'text', answer: 'location-guess', prompt: "Baku", lat: 40.4093, lng: 49.8671, locationName: "Baku, Azerbaijan" },
    { present: 'text', answer: 'location-guess', prompt: "Yerevan", lat: 40.1792, lng: 44.4991, locationName: "Yerevan, Armenia" },

    // More European cities
    { present: 'text', answer: 'location-guess', prompt: "Nice", lat: 43.7102, lng: 7.2620, locationName: "Nice, France" },
    { present: 'text', answer: 'location-guess', prompt: "Cannes", lat: 43.5528, lng: 7.0174, locationName: "Cannes, France" },
    { present: 'text', answer: 'location-guess', prompt: "Lyon", lat: 45.7640, lng: 4.8357, locationName: "Lyon, France" },
    { present: 'text', answer: 'location-guess', prompt: "Marseille", lat: 43.2965, lng: 5.3698, locationName: "Marseille, France" },
    { present: 'text', answer: 'location-guess', prompt: "Bordeaux", lat: 44.8378, lng: -0.5792, locationName: "Bordeaux, France" },
    { present: 'text', answer: 'location-guess', prompt: "Frankfurt", lat: 50.1109, lng: 8.6821, locationName: "Frankfurt, Germany" },
    { present: 'text', answer: 'location-guess', prompt: "Hamburg", lat: 53.5511, lng: 9.9937, locationName: "Hamburg, Germany" },
    { present: 'text', answer: 'location-guess', prompt: "Cologne", lat: 50.9375, lng: 6.9603, locationName: "Cologne, Germany" },
    { present: 'text', answer: 'location-guess', prompt: "Naples", lat: 40.8518, lng: 14.2681, locationName: "Naples, Italy" },
    { present: 'text', answer: 'location-guess', prompt: "Seville", lat: 37.3891, lng: -5.9845, locationName: "Seville, Spain" },
    { present: 'text', answer: 'location-guess', prompt: "Valencia", lat: 39.4699, lng: -0.3763, locationName: "Valencia, Spain" },
    { present: 'text', answer: 'location-guess', prompt: "Porto", lat: 41.1579, lng: -8.6291, locationName: "Porto, Portugal" },
    { present: 'text', answer: 'location-guess', prompt: "Bruges", lat: 51.2093, lng: 3.2247, locationName: "Bruges, Belgium" },
    { present: 'text', answer: 'location-guess', prompt: "Salzburg", lat: 47.8095, lng: 13.0550, locationName: "Salzburg, Austria" },
    { present: 'text', answer: 'location-guess', prompt: "Innsbruck", lat: 47.2692, lng: 11.4041, locationName: "Innsbruck, Austria" },
    { present: 'text', answer: 'location-guess', prompt: "Dubrovnik", lat: 42.6507, lng: 18.0944, locationName: "Dubrovnik, Croatia" },
    { present: 'text', answer: 'location-guess', prompt: "Split", lat: 43.5081, lng: 16.4402, locationName: "Split, Croatia" },
    { present: 'text', answer: 'location-guess', prompt: "Ljubljana", lat: 46.0569, lng: 14.5058, locationName: "Ljubljana, Slovenia" },
    { present: 'text', answer: 'location-guess', prompt: "Bratislava", lat: 48.1486, lng: 17.1077, locationName: "Bratislava, Slovakia" },
    { present: 'text', answer: 'location-guess', prompt: "Bucharest", lat: 44.4268, lng: 26.1025, locationName: "Bucharest, Romania" },
    { present: 'text', answer: 'location-guess', prompt: "Sofia", lat: 42.6977, lng: 23.3219, locationName: "Sofia, Bulgaria" },
    { present: 'text', answer: 'location-guess', prompt: "Belgrade", lat: 44.7866, lng: 20.4489, locationName: "Belgrade, Serbia" },
    { present: 'text', answer: 'location-guess', prompt: "Santorini", lat: 36.3932, lng: 25.4615, locationName: "Santorini, Greece" },
    { present: 'text', answer: 'location-guess', prompt: "Mykonos", lat: 37.4467, lng: 25.3289, locationName: "Mykonos, Greece" },

    // More Asian cities
    { present: 'text', answer: 'location-guess', prompt: "Macau", lat: 22.1987, lng: 113.5439, locationName: "Macau, China" },
    { present: 'text', answer: 'location-guess', prompt: "Xi'an", lat: 34.3416, lng: 108.9398, locationName: "Xi'an, China" },
    { present: 'text', answer: 'location-guess', prompt: "Hangzhou", lat: 30.2741, lng: 120.1551, locationName: "Hangzhou, China" },
    { present: 'text', answer: 'location-guess', prompt: "Nanjing", lat: 32.0603, lng: 118.7969, locationName: "Nanjing, China" },
    { present: 'text', answer: 'location-guess', prompt: "Siem Reap", lat: 13.3671, lng: 103.8448, locationName: "Siem Reap, Cambodia" },
    { present: 'text', answer: 'location-guess', prompt: "Luang Prabang", lat: 19.8830, lng: 102.1347, locationName: "Luang Prabang, Laos" },
    { present: 'text', answer: 'location-guess', prompt: "Yangon", lat: 16.8661, lng: 96.1951, locationName: "Yangon, Myanmar" },
    { present: 'text', answer: 'location-guess', prompt: "Jaipur", lat: 26.9124, lng: 75.7873, locationName: "Jaipur, India" },
    { present: 'text', answer: 'location-guess', prompt: "Agra", lat: 27.1767, lng: 78.0081, locationName: "Agra, India" },
    { present: 'text', answer: 'location-guess', prompt: "Varanasi", lat: 25.3176, lng: 82.9739, locationName: "Varanasi, India" },
    { present: 'text', answer: 'location-guess', prompt: "Goa", lat: 15.2993, lng: 74.1240, locationName: "Goa, India" },

    // Famous landmarks/places
    { present: 'text', answer: 'location-guess', prompt: "Great Wall of China", lat: 40.4319, lng: 116.5704, locationName: "Great Wall of China, China" },
    { present: 'text', answer: 'location-guess', prompt: "Petra", lat: 30.3285, lng: 35.4444, locationName: "Petra, Jordan" },
    { present: 'text', answer: 'location-guess', prompt: "Angkor Wat", lat: 13.4125, lng: 103.8670, locationName: "Angkor Wat, Cambodia" },
    { present: 'text', answer: 'location-guess', prompt: "Pyramids of Giza", lat: 29.9792, lng: 31.1342, locationName: "Pyramids of Giza, Egypt" },
    { present: 'text', answer: 'location-guess', prompt: "Niagara Falls", lat: 43.0962, lng: -79.0377, locationName: "Niagara Falls, Canada" },
    { present: 'text', answer: 'location-guess', prompt: "Grand Canyon", lat: 36.1069, lng: -112.1129, locationName: "Grand Canyon, USA" },
    { present: 'text', answer: 'location-guess', prompt: "Mount Everest", lat: 27.9881, lng: 86.9250, locationName: "Mount Everest, Nepal" },
    { present: 'text', answer: 'location-guess', prompt: "Mount Fuji", lat: 35.3606, lng: 138.7274, locationName: "Mount Fuji, Japan" },
    { present: 'text', answer: 'location-guess', prompt: "Uluru", lat: -25.3444, lng: 131.0369, locationName: "Uluru, Australia" },
    { present: 'text', answer: 'location-guess', prompt: "Christ the Redeemer", lat: -22.9519, lng: -43.2105, locationName: "Christ the Redeemer, Brazil" },
];

/**
 * Get a random city/location question
 */
export function getRandomCity() {
    return cities[Math.floor(Math.random() * cities.length)];
}

// Keep old function name for compatibility, but use new terminology internally
export function getRandomTextLocation() {
    return getRandomCity();
}

/**
 * Calculate distance between two points in km (Haversine formula)
 * Note: Now uses 'lng' parameter name for consistency with solo game
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}
