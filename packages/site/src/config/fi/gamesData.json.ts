// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Lyhyt teksti, joka näytetään pelinvalintasivun korteilla.
// Pidemmät SEO-tekstit ovat tiedostossa shared/games-seo.json ja niitä käytetään JSON-LD:ssä.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Arvaa maa kappaleen perusteella.",
	},
	"euro-winners-2000s": {
		title: "Eurovision-voittajat",
		description: "Arvaa kaikki Eurovision-voittajat vuosilta 2000–2025.",
	},
	"game-quiz": {
		title: "Videopelien synty",
		description: "Arvaa missä kukin peli on tehty.",
	},
	"united-states-of-america-states": {
		title: "USA:n osavaltiot",
		description: "Aseta kaikki 50 osavaltiota maapallolle.",
	},
	"the-world-countries": {
		title: "Maailman maat",
		description: "Aseta jokainen maa maapallolle.",
	},
	"the-world-flags": {
		title: "Maailman liput",
		description: "Yhdistä jokainen lippu oikeaan maahan.",
	},
};

// Käännösteksti, joka näytetään pikkukuvassa (vihreä otsikko + valkoinen alaotsikko).
// Kun se on asetettu, pikkukuva käyttää taustaa, jossa ei ole sisäänrakennettua tekstiä.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Euro Music Quiz",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Euro Music Quiz -voittajat",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Pelit",
		subtitle: "Alkuperä",
	},
	"united-states-of-america-states": {
		title: "Osavaltiot",
		subtitle: "USA",
	},
	"the-world-countries": {
		title: "Maat",
		subtitle: "Maailma",
	},
	"the-world-flags": {
		title: "Liput",
		subtitle: "Maailma",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).fi ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/fi/`,
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
	{ title: "Suositut tietovisat", gameIds: allGameIds },
	{ title: "Klassinen maantiede", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Pelit",
	pageSubtitle: "Pelaa maantieteenpelejä ja testaa tietosi",
	playButton: "Pelaa",
	games,
	topics,
	downloadBento: {
		title: "Lataa sovellus nyt!",
		appName: "Jordglobe Maantieto",
		ariaLabel: "Lataa Jordglobe",
		altPhones: "Jordglobe kolmessa puhelimessa",
		altAppIcon: "Jordglobe-sovelluskuvake",
		altGooglePlay: "Lataa Google Playsta",
		altAppStore: "Lataa App Storesta",
		altQr: "QR-koodi Jordgloben lataamiseen",
	},
};

export default gamesData;
