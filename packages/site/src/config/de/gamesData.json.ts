// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Kurzer Karten-Text auf der Spieleübersicht.
// Lange SEO-Texte bleiben in shared/games-seo.json und werden für JSON-LD verwendet.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Errate das Land anhand des Songs.",
	},
	"euro-winners-2000s": {
		title: "Eurovision-Sieger",
		description: "Errate jeden Eurovision-Sieger von 2000–2025.",
	},
	"game-quiz": {
		title: "Videospiel-Herkunft",
		description: "Errate, wo jedes Spiel entstanden ist.",
	},
	"united-states-of-america-states": {
		title: "US-Bundesstaaten",
		description: "Platziere alle 50 Bundesstaaten auf dem Globus.",
	},
	"the-world-countries": {
		title: "Länder der Welt",
		description: "Platziere jedes Land auf dem Globus.",
	},
	"the-world-flags": {
		title: "Flaggen der Welt",
		description: "Ordne jede Flagge ihrem Land zu.",
	},
};

// Übersetzbarer Text auf dem Vorschaubild (grüner Titel + weißer Untertitel).
// Wenn gesetzt, nutzt das Vorschaubild ein labelfreies Hintergrundbild.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Euro Music Quiz Sieger",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Spiele",
		subtitle: "Herkunft",
	},
	"united-states-of-america-states": {
		title: "Staaten",
		subtitle: "USA",
	},
	"the-world-countries": {
		title: "Länder",
		subtitle: "Welt",
	},
	"the-world-flags": {
		title: "Flaggen",
		subtitle: "Welt",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).de ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/de/games/${id}/`,
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
	{ title: "Top-Quizze", gameIds: allGameIds },
	{ title: "Klassische Geografie", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Spiele",
	pageSubtitle: "Spiele Geografie-Quizze und teste dein Wissen",
	playButton: "Jetzt spielen",
	games,
	topics,
};

export default gamesData;
