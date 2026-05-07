// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Korte tekst die op de kaarten van de spelkiezerpagina wordt getoond.
// Langere SEO-teksten staan in shared/games-seo.json en worden gebruikt voor JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovisie 2026",
		description: "Raad het land op basis van het lied.",
	},
	"euro-winners-2000s": {
		title: "Eurovisie-winnaars",
		description: "Raad alle Eurovisie-winnaars van 2000 tot 2025.",
	},
	"game-quiz": {
		title: "Oorsprong van videogames",
		description: "Raad waar elke game is gemaakt.",
	},
	"united-states-of-america-states": {
		title: "Amerikaanse staten",
		description: "Plaats alle 50 staten op de globe.",
	},
	"the-world-countries": {
		title: "Landen van de wereld",
		description: "Plaats elk land op de globe.",
	},
	"the-world-flags": {
		title: "Vlaggen van de wereld",
		description: "Match elke vlag met het juiste land.",
	},
};

// Vertaalde tekst die op de miniatuur verschijnt (groene titel + witte ondertitel).
// Wanneer dit is ingesteld, gebruikt de miniatuur een achtergrond zonder ingebouwd label.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Winnaars van Euro Music Quiz",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Games",
		subtitle: "Oorsprong",
	},
	"united-states-of-america-states": {
		title: "Staten",
		subtitle: "VS",
	},
	"the-world-countries": {
		title: "Landen",
		subtitle: "Wereld",
	},
	"the-world-flags": {
		title: "Vlaggen",
		subtitle: "Wereld",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).nl ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/nl/`,
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
	{ title: "Populaire quizzen", gameIds: allGameIds },
	{ title: "Klassieke aardrijkskunde", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Spellen",
	pageSubtitle: "Speel aardrijkskundespellen en test je kennis",
	playButton: "Spelen",
	games,
	topics,
	downloadBento: {
		title: "Download de app nu!",
		appName: "Jordglobe Aardrijkskunde",
		ariaLabel: "Download Jordglobe",
		altPhones: "Jordglobe op drie telefoons",
		altAppIcon: "Jordglobe-app-icoon",
		altGooglePlay: "Download op Google Play",
		altAppStore: "Download in de App Store",
		altQr: "QR-code om Jordglobe te downloaden",
	},
};

export default gamesData;
