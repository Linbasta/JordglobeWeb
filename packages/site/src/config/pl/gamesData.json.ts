// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Krótki tekst wyświetlany na kartach na stronie wyboru gier.
// Dłuższe teksty SEO znajdują się w shared/games-seo.json i służą do JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurowizja 2026",
		description: "Zgadnij państwo na podstawie piosenki.",
	},
	"euro-winners-2000s": {
		title: "Zwycięzcy Eurowizji",
		description: "Zgadnij każdego zwycięzcę Eurowizji od 2000 do 2025 roku.",
	},
	"game-quiz": {
		title: "Pochodzenie gier wideo",
		description: "Zgadnij, gdzie powstała każda gra.",
	},
	"united-states-of-america-states": {
		title: "Stany USA",
		description: "Umieść wszystkie 50 stanów na globusie.",
	},
	"the-world-countries": {
		title: "Państwa świata",
		description: "Umieść każde państwo na globusie.",
	},
	"the-world-flags": {
		title: "Flagi świata",
		description: "Dopasuj każdą flagę do jej państwa.",
	},
};

// Tekst do tłumaczenia wyświetlany na miniaturze (zielony tytuł + biały podtytuł).
// Gdy jest ustawiony, miniatura używa tła bez etykiety.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Zwycięzcy Euro Music Quiz",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Gry",
		subtitle: "Pochodzenie",
	},
	"united-states-of-america-states": {
		title: "Stany",
		subtitle: "USA",
	},
	"the-world-countries": {
		title: "Państwa",
		subtitle: "Świat",
	},
	"the-world-flags": {
		title: "Flagi",
		subtitle: "Świat",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).pl ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/pl/`,
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
	{ title: "Popularne quizy", gameIds: allGameIds },
	{ title: "Klasyczna geografia", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Gry",
	pageSubtitle: "Zagraj w gry geograficzne i sprawdź swoją wiedzę",
	playButton: "Graj",
	games,
	topics,
};

export default gamesData;
