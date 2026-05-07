// Import shared SEO config (single source of truth for SEO meta)
import gamesSeoConfig from "../../../../../shared/games-seo.json";

// Короткий текст, що відображається на картках сторінки вибору ігор.
// Довші SEO-тексти знаходяться в shared/games-seo.json і використовуються для JSON-LD.
const cardCopy: Record<string, { title: string; description: string }> = {
	"euro-music-quiz": {
		title: "Євробачення 2026",
		description: "Вгадай країну за піснею.",
	},
	"euro-winners-2000s": {
		title: "Переможці Євробачення",
		description: "Вгадай усіх переможців Євробачення з 2000 по 2025 рік.",
	},
	"game-quiz": {
		title: "Походження відеоігор",
		description: "Вгадай, де створено кожну гру.",
	},
	"united-states-of-america-states": {
		title: "Штати США",
		description: "Розмісти всі 50 штатів на глобусі.",
	},
	"the-world-countries": {
		title: "Країни світу",
		description: "Розмісти кожну країну на глобусі.",
	},
	"the-world-flags": {
		title: "Прапори світу",
		description: "Зістав кожен прапор з відповідною країною.",
	},
};

// Перекладений текст, що з'являється на мініатюрі (зелений заголовок + білий підзаголовок).
// Якщо встановлено, мініатюра використовує фон без вбудованої підпису.
const cardLabels: Record<string, { title: string; subtitle: string }> = {
	"euro-music-quiz": {
		title: "Музична вікторина",
		subtitle: "2026",
	},
	"euro-winners-2000s": {
		title: "Переможці музичної вікторини",
		subtitle: "2000–2025",
	},
	"game-quiz": {
		title: "Ігри",
		subtitle: "Походження",
	},
	"united-states-of-america-states": {
		title: "Штати",
		subtitle: "США",
	},
	"the-world-countries": {
		title: "Країни",
		subtitle: "Світ",
	},
	"the-world-flags": {
		title: "Прапори",
		subtitle: "Світ",
	},
};

const games = Object.entries(gamesSeoConfig.games).map(([id, game]) => {
	const card = cardCopy[id];
	const seo = (game as any).uk ?? game.en;
	return {
		id,
		title: card?.title ?? seo.ogTitle,
		description: card?.description ?? seo.ogDescription,
		seoTitle: seo.ogTitle || seo.title.split(" | ")[0],
		seoDescription: seo.description,
		image: id, // Image key for imageMap in GameSelectorPage
		cardLabel: cardLabels[id],
		link: `/games/${id}/uk/`,
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
	{ title: "Популярні вікторини", gameIds: allGameIds },
	{ title: "Класична географія", gameIds: classicGeographyIds },
];

const gamesData = {
	pageTitle: "Ігри",
	pageSubtitle: "Грайте в географічні вікторини та перевіряйте свої знання",
	playButton: "Грати",
	games,
	topics,
	downloadBento: {
		title: "Завантажте застосунок зараз!",
		appName: "Jordglobe Географія",
		ariaLabel: "Завантажити Jordglobe",
		altPhones: "Jordglobe на трьох телефонах",
		altAppIcon: "Іконка застосунку Jordglobe",
		altGooglePlay: "Завантажити в Google Play",
		altAppStore: "Завантажити в App Store",
		altQr: "QR-код для завантаження Jordglobe",
	},
};

export default gamesData;
