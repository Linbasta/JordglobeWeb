// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Breve testo delle card nella panoramica dei giochi.
// I testi SEO lunghi restano in shared/games-seo.json e vengono usati per JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Indovina il paese dalla canzone.",
	},
	"euro-winners-2000s": {
		title: "Vincitori Eurovision",
		description: "Indovina ogni vincitore dell'Eurovision dal 2000 al 2025.",
	},
	"game-quiz": {
		title: "Origini dei videogiochi",
		description: "Indovina dove è stato creato ogni gioco.",
	},
	"united-states-of-america-states": {
		title: "Stati USA",
		description: "Posiziona tutti i 50 stati sul globo.",
	},
	"the-world-countries": {
		title: "Paesi del mondo",
		description: "Posiziona ogni paese sul globo.",
	},
	"the-world-flags": {
		title: "Bandiere del mondo",
		description: "Abbina ogni bandiera al suo paese.",
	},
};

// Testo traducibile sull'immagine di anteprima (titolo verde + sottotitolo bianco).
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Euro Music Quiz Vincitori",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Videogiochi",
		subtitle: "Origini",
	},
	"united-states-of-america-states": {
		title: "Stati",
		subtitle: "USA",
	},
	"the-world-countries": {
		title: "Paesi",
		subtitle: "Mondo",
	},
	"the-world-flags": {
		title: "Bandiere",
		subtitle: "Mondo",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).it ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/it/`,
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
	{ title: "Quiz migliori", gameIds: allGameIds },
	{ title: "Geografia classica", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Giochi",
	pageSubtitle: "Gioca a quiz di geografia e metti alla prova le tue conoscenze",
	playButton: "Gioca ora",
	games,
	topics,
	downloadBento: {
		title: "Scarica l'app ora!",
		appName: "Jordglobe Geografia",
		ariaLabel: "Scarica Jordglobe",
		altPhones: "Jordglobe su tre telefoni",
		altAppIcon: "Icona dell'app Jordglobe",
		altGooglePlay: "Disponibile su Google Play",
		altAppStore: "Scarica su App Store",
		altQr: "Codice QR per scaricare Jordglobe",
	},
};

export default gamesData;
