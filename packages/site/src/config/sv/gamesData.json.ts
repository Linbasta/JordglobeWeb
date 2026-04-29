// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Kort kortext som visas på startsidan.
// Långa SEO-texter ligger kvar i shared/games-seo.json och används för JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Gissa landet från låten.",
	},
	"euro-winners-2000s": {
		title: "Eurovision-vinnare",
		description: "Gissa varje Eurovision-vinnare från 2000–2025.",
	},
	"game-quiz": {
		title: "Datorspelens ursprung",
		description: "Gissa var varje spel gjordes.",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	return {
		id,
		title: card?.title ?? game.sv.ogTitle,
		description: card?.description ?? game.sv.ogDescription,
		seoTitle: game.sv.ogTitle || game.sv.title.split(" | ")[0],
		seoDescription: game.sv.description,
		image: id, // Image key for imageMap in GameSelectorPage
		link: `/sv/games/${id}/`,
		genre: game.genre,
	};
});

const allGameIds = games.map((g) => g.id);

const topics = [
	{ title: "Topp trivia", gameIds: allGameIds },
	{ title: "Klassisk geografi", gameIds: allGameIds },
];

const gamesData = {
	pageTitle: "Spel",
	pageSubtitle: "Spela geografispel och testa dina kunskaper",
	playButton: "Spela nu",
	games,
	topics,
};

export default gamesData;
