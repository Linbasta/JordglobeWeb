// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Texto corto que se muestra en las tarjetas de la página de selección de juegos.
// Los textos SEO más largos están en shared/games-seo.json y se usan para JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovisión 2026",
		description: "Adivina el país a partir de la canción.",
	},
	"euro-winners-2000s": {
		title: "Ganadores de Eurovisión",
		description: "Adivina cada ganador de Eurovisión desde el año 2000 hasta 2025.",
	},
	"game-quiz": {
		title: "Origen de los videojuegos",
		description: "Adivina dónde se creó cada juego.",
	},
	"united-states-of-america-states": {
		title: "Estados de EE. UU.",
		description: "Coloca los 50 estados en el globo.",
	},
	"the-world-countries": {
		title: "Países del mundo",
		description: "Coloca cada país en el globo.",
	},
	"the-world-flags": {
		title: "Banderas del mundo",
		description: "Empareja cada bandera con su país.",
	},
};

// Texto traducible que se muestra en la miniatura (título verde + subtítulo blanco).
// Cuando está definido, la miniatura usa el fondo sin etiqueta.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Ganadores Euro Music Quiz",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Juegos",
		subtitle: "Origen",
	},
	"united-states-of-america-states": {
		title: "Estados",
		subtitle: "EE. UU.",
	},
	"the-world-countries": {
		title: "Países",
		subtitle: "Mundo",
	},
	"the-world-flags": {
		title: "Banderas",
		subtitle: "Mundo",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).es ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/es/`,
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
	{ title: "Cuestionarios populares", gameIds: allGameIds },
	{ title: "Geografía clásica", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Juegos",
	pageSubtitle: "Juega a juegos de geografía y pon a prueba tus conocimientos",
	playButton: "Jugar",
	games,
	topics,
	downloadBento: {
		title: "¡Descarga la app ahora!",
		appName: "Jordglobe Geografía",
		ariaLabel: "Descargar Jordglobe",
		altPhones: "Jordglobe en tres teléfonos",
		altAppIcon: "Icono de la app Jordglobe",
		altGooglePlay: "Disponible en Google Play",
		altAppStore: "Descargar en App Store",
		altQr: "Código QR para descargar Jordglobe",
	},
};

export default gamesData;
