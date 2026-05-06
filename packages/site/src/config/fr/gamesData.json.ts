// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Texte court affiché sur les cartes de la page de sélection.
// Les longs textes SEO restent dans shared/games-seo.json et servent au JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Devinez le pays à partir de la chanson.",
	},
	"euro-winners-2000s": {
		title: "Vainqueurs de l'Eurovision",
		description: "Devinez chaque vainqueur de l'Eurovision de 2000 à 2025.",
	},
	"game-quiz": {
		title: "Origines des jeux vidéo",
		description: "Devinez où chaque jeu a été créé.",
	},
	"united-states-of-america-states": {
		title: "États des USA",
		description: "Placez les 50 États sur le globe.",
	},
	"the-world-countries": {
		title: "Pays du monde",
		description: "Placez chaque pays sur le globe.",
	},
	"the-world-flags": {
		title: "Drapeaux du monde",
		description: "Associez chaque drapeau à son pays.",
	},
};

// Texte traduisible affiché sur la vignette (titre vert + sous-titre blanc).
// Quand il est défini, la vignette utilise une image de fond sans étiquette.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Vainqueurs Euro Music Quiz",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Jeux",
		subtitle: "Origines",
	},
	"united-states-of-america-states": {
		title: "États",
		subtitle: "USA",
	},
	"the-world-countries": {
		title: "Pays",
		subtitle: "Monde",
	},
	"the-world-flags": {
		title: "Drapeaux",
		subtitle: "Monde",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).fr ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/fr/`,
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
	{ title: "Quiz populaires", gameIds: allGameIds },
	{ title: "Géographie classique", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Jeux",
	pageSubtitle: "Jouez à des jeux de géographie et testez vos connaissances",
	playButton: "Jouer",
	games,
	topics,
};

export default gamesData;
