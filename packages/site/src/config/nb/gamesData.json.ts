// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Kort tekst som vises på kortene på spillvelger-siden.
// Lengre SEO-tekster ligger i shared/games-seo.json og brukes til JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Gjett landet ut fra sangen.",
	},
	"euro-winners-2000s": {
		title: "Eurovision-vinnere",
		description: "Gjett alle Eurovision-vinnere fra 2000 til 2025.",
	},
	"game-quiz": {
		title: "Dataspillenes opprinnelse",
		description: "Gjett hvor hvert spill ble laget.",
	},
	"united-states-of-america-states": {
		title: "USAs delstater",
		description: "Plasser alle 50 delstater på globusen.",
	},
	"the-world-countries": {
		title: "Verdens land",
		description: "Plasser hvert land på globusen.",
	},
	"the-world-flags": {
		title: "Verdens flagg",
		description: "Match hvert flagg med riktig land.",
	},
};

// Tekst til oversettelse vist på miniatyren (grønn tittel + hvit undertittel).
// Når den er satt, bruker miniatyren en bakgrunn uten innebygd label.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Vinnere av Euro Music Quiz",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Spill",
		subtitle: "Opprinnelse",
	},
	"united-states-of-america-states": {
		title: "Delstater",
		subtitle: "USA",
	},
	"the-world-countries": {
		title: "Land",
		subtitle: "Verden",
	},
	"the-world-flags": {
		title: "Flagg",
		subtitle: "Verden",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).nb ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/nb/`,
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
	{ title: "Populære quizer", gameIds: allGameIds },
	{ title: "Klassisk geografi", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Spill",
	pageSubtitle: "Spill geografispill og test kunnskapen din",
	playButton: "Spill",
	games,
	topics,
	downloadBento: {
		title: "Last ned appen nå!",
		appName: "Jordglobe Geografi",
		ariaLabel: "Last ned Jordglobe",
		altPhones: "Jordglobe på tre telefoner",
		altAppIcon: "Jordglobe-appikon",
		altGooglePlay: "Last ned på Google Play",
		altAppStore: "Last ned i App Store",
		altQr: "QR-kode for å laste ned Jordglobe",
	},
};

export default gamesData;
