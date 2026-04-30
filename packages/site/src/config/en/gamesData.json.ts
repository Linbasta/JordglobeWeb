// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Short, single-line copy used on the game-selector cards.
// Long-form SEO text stays in shared/games-seo.json and is used for JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Guess the country from the song.",
	},
	"euro-winners-2000s": {
		title: "Eurovision Winners",
		description: "Guess every Eurovision winner from 2000–2025.",
	},
	"game-quiz": {
		title: "Video Game Origins",
		description: "Guess where each game was made.",
	},
	"united-states-of-america-states": {
		title: "US States",
		description: "Pin all 50 states on the globe.",
	},
	"the-world-countries": {
		title: "Countries of the World",
		description: "Pin every country on the globe.",
	},
	"the-world-flags": {
		title: "Flags of the World",
		description: "Match every flag to its country.",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	return {
		id,
		title: card?.title ?? game.en.ogTitle,
		description: card?.description ?? game.en.ogDescription,
		seoTitle: game.en.ogTitle || game.en.title.split(" | ")[0],
		seoDescription: game.en.description,
		image: id, // Image key for imageMap in GameSelectorPage
		link: `/games/${id}/`,
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
	{ title: "Top trivia", gameIds: allGameIds },
	{ title: "Classic geography", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Games",
	pageSubtitle: "Play geography games and test your knowledge",
	playButton: "Play Now",
	games,
	topics,
};

export default gamesData;
