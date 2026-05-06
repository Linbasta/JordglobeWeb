// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Texto curto exibido nos cards da página de seleção de jogos.
// Os textos SEO mais longos estão em shared/games-seo.json e são usados para JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovisão 2026",
		description: "Adivinhe o país pela música.",
	},
	"euro-winners-2000s": {
		title: "Vencedores da Eurovisão",
		description: "Adivinhe cada vencedor da Eurovisão de 2000 a 2025.",
	},
	"game-quiz": {
		title: "Origem dos videogames",
		description: "Adivinhe onde cada jogo foi criado.",
	},
	"united-states-of-america-states": {
		title: "Estados dos EUA",
		description: "Coloque os 50 estados no globo.",
	},
	"the-world-countries": {
		title: "Países do mundo",
		description: "Coloque cada país no globo.",
	},
	"the-world-flags": {
		title: "Bandeiras do mundo",
		description: "Combine cada bandeira com seu país.",
	},
};

// Texto traduzível exibido na miniatura (título verde + subtítulo branco).
// Quando definido, a miniatura usa o fundo sem rótulo.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Vencedores Euro Music Quiz",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Jogos",
		subtitle: "Origem",
	},
	"united-states-of-america-states": {
		title: "Estados",
		subtitle: "EUA",
	},
	"the-world-countries": {
		title: "Países",
		subtitle: "Mundo",
	},
	"the-world-flags": {
		title: "Bandeiras",
		subtitle: "Mundo",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).pt ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/pt/`,
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
	{ title: "Quizzes populares", gameIds: allGameIds },
	{ title: "Geografia clássica", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Jogos",
	pageSubtitle: "Jogue jogos de geografia e teste seus conhecimentos",
	playButton: "Jogar",
	games,
	topics,
};

export default gamesData;
