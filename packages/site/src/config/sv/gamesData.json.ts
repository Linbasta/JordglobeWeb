// Import shared SEO config (single source of truth)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Derive game listing data from SEO config (Swedish locale)
const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => ({
	id,
	title: game.sv.ogTitle || game.sv.title.split(" | ")[0], // Use short title for cards
	description: game.sv.description,
	image: id, // Image key for imageMap in GamesPage
	link: `/sv/games/${id}/`,
	genre: game.genre,
}));

const gamesData = {
	pageTitle: "Spel",
	pageSubtitle: "Spela geografispel och testa dina kunskaper",
	playButton: "Spela nu",
	games,
};

export default gamesData;
