// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Σύντομο κείμενο που εμφανίζεται στις κάρτες της σελίδας επιλογής παιχνιδιών.
// Τα μεγαλύτερα κείμενα SEO βρίσκονται στο shared/games-seo.json και χρησιμοποιούνται για JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Eurovision 2026",
		description: "Μάντεψε τη χώρα από το τραγούδι.",
	},
	"euro-winners-2000s": {
		title: "Νικητές Eurovision",
		description: "Μάντεψε όλους τους νικητές της Eurovision από το 2000 έως το 2025.",
	},
	"game-quiz": {
		title: "Προέλευση βιντεοπαιχνιδιών",
		description: "Μάντεψε πού φτιάχτηκε κάθε παιχνίδι.",
	},
	"united-states-of-america-states": {
		title: "Πολιτείες ΗΠΑ",
		description: "Τοποθέτησε και τις 50 πολιτείες στην υδρόγειο.",
	},
	"the-world-countries": {
		title: "Χώρες του κόσμου",
		description: "Τοποθέτησε κάθε χώρα στην υδρόγειο.",
	},
	"the-world-flags": {
		title: "Σημαίες του κόσμου",
		description: "Αντιστοίχισε κάθε σημαία με τη σωστή χώρα.",
	},
};

// Μεταφρασμένο κείμενο που εμφανίζεται στη μικρογραφία (πράσινος τίτλος + λευκός υπότιτλος).
// Όταν είναι ορισμένο, η μικρογραφία χρησιμοποιεί φόντο χωρίς ενσωματωμένη ετικέτα.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Μουσικό κουίζ",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Νικητές μουσικού κουίζ",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Παιχνίδια",
		subtitle: "Προέλευση",
	},
	"united-states-of-america-states": {
		title: "Πολιτείες",
		subtitle: "ΗΠΑ",
	},
	"the-world-countries": {
		title: "Χώρες",
		subtitle: "Κόσμος",
	},
	"the-world-flags": {
		title: "Σημαίες",
		subtitle: "Κόσμος",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).el ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/el/`,
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
	{ title: "Δημοφιλή κουίζ", gameIds: allGameIds },
	{ title: "Κλασική γεωγραφία", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Παιχνίδια",
	pageSubtitle: "Παίξε παιχνίδια γεωγραφίας και δοκίμασε τις γνώσεις σου",
	playButton: "Παίξε",
	games,
	topics,
	downloadBento: {
		title: "Κατέβασε την εφαρμογή τώρα!",
		appName: "Jordglobe Γεωγραφία",
		ariaLabel: "Λήψη Jordglobe",
		altPhones: "Το Jordglobe σε τρία τηλέφωνα",
		altAppIcon: "Εικονίδιο εφαρμογής Jordglobe",
		altGooglePlay: "Λήψη από το Google Play",
		altAppStore: "Λήψη από το App Store",
		altQr: "Κωδικός QR για λήψη του Jordglobe",
	},
};

export default gamesData;
