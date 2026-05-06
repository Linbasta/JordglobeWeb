// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Oyun seçim sayfasındaki kartlarda gösterilen kısa metin.
// Daha uzun SEO metinleri shared/games-seo.json içindedir ve JSON-LD için kullanılır.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Şarkıdan ülkeyi tahmin et.",
	},
	"euro-winners-2000s": {
		title: "Eurovision şampiyonları",
		description: "2000'den 2025'e kadar her Eurovision şampiyonunu tahmin et.",
	},
	"game-quiz": {
		title: "Video oyunlarının kökeni",
		description: "Her oyunun nerede yapıldığını tahmin et.",
	},
	"united-states-of-america-states": {
		title: "ABD eyaletleri",
		description: "50 eyaleti küre üzerine yerleştir.",
	},
	"the-world-countries": {
		title: "Dünyanın ülkeleri",
		description: "Her ülkeyi küre üzerine yerleştir.",
	},
	"the-world-flags": {
		title: "Dünyanın bayrakları",
		description: "Her bayrağı kendi ülkesiyle eşleştir.",
	},
};

// Küçük resimde gösterilen çevrilebilir metin (yeşil başlık + beyaz alt başlık).
// Tanımlandığında küçük resim etiketsiz arka planı kullanır.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Euro Music Quiz Şampiyonları",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Oyunlar",
		subtitle: "Köken",
	},
	"united-states-of-america-states": {
		title: "Eyaletler",
		subtitle: "ABD",
	},
	"the-world-countries": {
		title: "Ülkeler",
		subtitle: "Dünya",
	},
	"the-world-flags": {
		title: "Bayraklar",
		subtitle: "Dünya",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).tr ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/tr/`,
		genre: game.genre,
	};
});

const allGameIds = games.map((g) => g.id);
const classicGeographyIds = [
	"united-states-of-america-states",
	"the-world-countries",
	"the-world-flags",
];

const topics = [
	{ title: "Popüler sınavlar", gameIds: allGameIds },
	{ title: "Klasik coğrafya", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Oyunlar",
	pageSubtitle: "Coğrafya oyunları oyna ve bilgini sına",
	playButton: "Oyna",
	games,
	topics,
};

export default gamesData;
