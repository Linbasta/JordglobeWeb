// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Kort tekst, der vises på kortene på spilvælger-siden.
// Længere SEO-tekster ligger i shared/games-seo.json og bruges til JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Gæt landet ud fra sangen.",
	},
	"euro-winners-2000s": {
		title: "Eurovision-vindere",
		description: "Gæt alle Eurovision-vindere fra 2000 til 2025.",
	},
	"game-quiz": {
		title: "Computerspils oprindelse",
		description: "Gæt, hvor hvert spil blev skabt.",
	},
	"united-states-of-america-states": {
		title: "USA's stater",
		description: "Placér alle 50 stater på globussen.",
	},
	"the-world-countries": {
		title: "Verdens lande",
		description: "Placér hvert land på globussen.",
	},
	"the-world-flags": {
		title: "Verdens flag",
		description: "Match hvert flag med dets land.",
	},
};

// Tekst til oversættelse vist på miniaturen (grøn titel + hvid undertitel).
// Når den er sat, bruger miniaturen en baggrund uden indbygget label.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Vindere af Euro Music Quiz",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Spil",
		subtitle: "Oprindelse",
	},
	"united-states-of-america-states": {
		title: "Stater",
		subtitle: "USA",
	},
	"the-world-countries": {
		title: "Lande",
		subtitle: "Verden",
	},
	"the-world-flags": {
		title: "Flag",
		subtitle: "Verden",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).da ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/da/`,
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
	{ title: "Populære quizzer", gameIds: allGameIds },
	{ title: "Klassisk geografi", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Spil",
	pageSubtitle: "Spil geografispil og test din viden",
	playButton: "Spil",
	games,
	topics,
	downloadBento: {
		title: "Download appen nu!",
		appName: "Jordglobe Geografi",
		ariaLabel: "Download Jordglobe",
		altPhones: "Jordglobe på tre telefoner",
		altAppIcon: "Jordglobe-appikon",
		altGooglePlay: "Hent på Google Play",
		altAppStore: "Hent i App Store",
		altQr: "QR-kode til download af Jordglobe",
	},
};

export default gamesData;
