// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Krátký text zobrazený na kartách na stránce s výběrem her.
// Delší SEO texty se nacházejí v shared/games-seo.json a používají se pro JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovize 2026",
		description: "Hádej zemi podle písně.",
	},
	"euro-winners-2000s": {
		title: "Vítězové Eurovize",
		description: "Hádej všechny vítěze Eurovize od roku 2000 do 2025.",
	},
	"game-quiz": {
		title: "Původ videoher",
		description: "Hádej, kde každá hra vznikla.",
	},
	"united-states-of-america-states": {
		title: "Státy USA",
		description: "Umísti všech 50 států na zeměkouli.",
	},
	"the-world-countries": {
		title: "Země světa",
		description: "Umísti každou zemi na zeměkouli.",
	},
	"the-world-flags": {
		title: "Vlajky světa",
		description: "Přiřaď každou vlajku ke správné zemi.",
	},
};

// Přeložený text zobrazený na náhledu (zelený titulek + bílý podtitulek).
// Když je nastaven, náhled používá pozadí bez vestavěného popisku.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Hudební kvíz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Vítězové hudebního kvízu",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Hry",
		subtitle: "Původ",
	},
	"united-states-of-america-states": {
		title: "Státy",
		subtitle: "USA",
	},
	"the-world-countries": {
		title: "Země",
		subtitle: "Svět",
	},
	"the-world-flags": {
		title: "Vlajky",
		subtitle: "Svět",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).cs ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/cs/`,
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
	{ title: "Populární kvízy", gameIds: allGameIds },
	{ title: "Klasický zeměpis", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Hry",
	pageSubtitle: "Hraj zeměpisné hry a vyzkoušej své znalosti",
	playButton: "Hrát",
	games,
	topics,
	downloadBento: {
		title: "Stáhni si aplikaci hned!",
		appName: "Jordglobe Zeměpis",
		ariaLabel: "Stáhnout Jordglobe",
		altPhones: "Jordglobe na třech telefonech",
		altAppIcon: "Ikona aplikace Jordglobe",
		altGooglePlay: "Stáhnout na Google Play",
		altAppStore: "Stáhnout v App Store",
		altQr: "QR kód pro stažení Jordglobe",
	},
};

export default gamesData;
