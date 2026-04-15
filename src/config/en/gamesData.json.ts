// Import shared SEO config (single source of truth)
import gamesSeoConfig from "../games-seo.json";

// Derive game listing data from SEO config
const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => ({
	id,
	title: game.en.ogTitle || game.en.title.split(" | ")[0], // Use short title for cards
	description: game.en.description,
	image: id, // Image key for imageMap in GamesPage
	link: `/games/${id}/`,
	genre: game.genre,
}));

const gamesData = {
	pageTitle: "Games",
	pageSubtitle: "Play geography games and test your knowledge",
	playButton: "Play Now",
	games,
};

export default gamesData;
