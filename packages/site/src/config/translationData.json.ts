/**
 * * Configuration of the i18n system data files and text translations
 * Example translations below are for English and Swedish, with textTranslations used in src/layouts/BlogLayoutCenter.astro and src/components/Hero/[hero].astro
 */

/**
 * * Data file configuration for the i18n system
 * Every {Data} key must exist in the below object
 */

// List of data keys to load per language
const dataKeys = [
	"siteData",
	"navData",
	"faqData",
	"teamData",
	"testimonialData",
	"gamesData",
];

// Define supported languages
const supportedLangs = ['en', 'sv', 'de', 'fr', 'it', 'pl', 'es', 'pt', 'tr', 'da', 'nb', 'fi', 'nl', 'uk'];

// Use static glob imports for each supported language
const modulesMap: Record<string, Record<string, any>> = {
	en: import.meta.glob('./en/*.json.ts', { eager: true }),
	sv: import.meta.glob('./sv/*.json.ts', { eager: true }),
	de: import.meta.glob('./de/*.json.ts', { eager: true }),
	fr: import.meta.glob('./fr/*.json.ts', { eager: true }),
	it: import.meta.glob('./it/*.json.ts', { eager: true }),
	pl: import.meta.glob('./pl/*.json.ts', { eager: true }),
	es: import.meta.glob('./es/*.json.ts', { eager: true }),
	pt: import.meta.glob('./pt/*.json.ts', { eager: true }),
	tr: import.meta.glob('./tr/*.json.ts', { eager: true }),
	da: import.meta.glob('./da/*.json.ts', { eager: true }),
	nb: import.meta.glob('./nb/*.json.ts', { eager: true }),
	fi: import.meta.glob('./fi/*.json.ts', { eager: true }),
	nl: import.meta.glob('./nl/*.json.ts', { eager: true }),
	uk: import.meta.glob('./uk/*.json.ts', { eager: true }),
};

// Build dataTranslations using modulesMap
const dataTranslations: Record<string, Record<string, any>> = {};
for (const lang of supportedLangs) {
	const modules = modulesMap[lang];
	dataTranslations[lang] = {};
	for (const key of dataKeys) {
		const filePath = `./${lang}/${key}.json.ts`;
		if (modules[filePath]) {
			dataTranslations[lang][key] = (modules[filePath] as any).default || modules[filePath];
		}
	}
}
export { dataTranslations };

/**
 * * Text translations are used with the `useTranslation` function from src/js/i18nUtils.ts to translate various strings on your site.
 *
 * ## Example
 *
 * ```ts
 * import { getLocaleFromUrl } from "@js/localeUtils";
 * import { useTranslations } from "@js/translationUtils";
 * const currLocale = getLocaleFromUrl(Astro.url);
 * const t = useTranslations(currLocale);
 * t("back_to_all_posts"); // example usage for "en" or "sv"
 * ```
 */
export const textTranslations = {
	en: {
		hero_text: "Everything you need for an amazing website.",
		hero_description:
			"A template for the next killer SaaS. Multiple pages and sections, blog, i18n, animations, CMS - all ready to go.",
		back_to_all_posts: "Back to all posts",
		updated: "Updated",
		nav_download: "Download",
		nav_about: "About",
		nav_games: "Games",
	},
	sv: {
		hero_text: "Allt du behöver för en fantastisk webbplats.",
		hero_description:
			"En mall för nästa stora SaaS. Flera sidor och sektioner, blogg, i18n, animationer, CMS - allt redo att gå.",
		back_to_all_posts: "Till alla inlägg",
		updated: "Uppdaterad",
		nav_download: "Ladda ner",
		nav_about: "Om oss",
		nav_games: "Spel",
	},
	de: {
		hero_text: "Alles, was du für eine großartige Website brauchst.",
		hero_description:
			"Eine Vorlage für das nächste große SaaS. Mehrere Seiten und Bereiche, Blog, i18n, Animationen, CMS – alles startklar.",
		back_to_all_posts: "Zurück zu allen Beiträgen",
		updated: "Aktualisiert",
		nav_download: "Herunterladen",
		nav_about: "Über uns",
		nav_games: "Spiele",
	},
	fr: {
		hero_text: "Tout ce qu'il vous faut pour un site web exceptionnel.",
		hero_description:
			"Un modèle pour le prochain SaaS incontournable. Plusieurs pages et sections, blog, i18n, animations, CMS – tout est prêt.",
		back_to_all_posts: "Retour à tous les articles",
		updated: "Mis à jour",
		nav_download: "Télécharger",
		nav_about: "À propos",
		nav_games: "Jeux",
	},
	it: {
		hero_text: "Tutto ciò che serve per un sito web straordinario.",
		hero_description:
			"Un template per il prossimo grande SaaS. Più pagine e sezioni, blog, i18n, animazioni, CMS – tutto pronto.",
		back_to_all_posts: "Torna a tutti gli articoli",
		updated: "Aggiornato",
		nav_download: "Scarica",
		nav_about: "Chi siamo",
		nav_games: "Giochi",
	},
	pl: {
		hero_text: "Wszystko, czego potrzebujesz do stworzenia świetnej strony.",
		hero_description:
			"Szablon dla kolejnego hitowego SaaS. Wiele stron i sekcji, blog, i18n, animacje, CMS – wszystko gotowe do pracy.",
		back_to_all_posts: "Powrót do wszystkich wpisów",
		updated: "Zaktualizowano",
		nav_download: "Pobierz",
		nav_about: "O nas",
		nav_games: "Gry",
	},
	es: {
		hero_text: "Todo lo que necesitas para una web increíble.",
		hero_description:
			"Una plantilla para el próximo gran SaaS. Varias páginas y secciones, blog, i18n, animaciones, CMS: todo listo para usar.",
		back_to_all_posts: "Volver a todos los artículos",
		updated: "Actualizado",
		nav_download: "Descargar",
		nav_about: "Sobre nosotros",
		nav_games: "Juegos",
	},
	pt: {
		hero_text: "Tudo o que você precisa para um site incrível.",
		hero_description:
			"Um modelo para o próximo grande SaaS. Várias páginas e seções, blog, i18n, animações, CMS — tudo pronto para usar.",
		back_to_all_posts: "Voltar para todas as postagens",
		updated: "Atualizado",
		nav_download: "Baixar",
		nav_about: "Sobre",
		nav_games: "Jogos",
	},
	tr: {
		hero_text: "Harika bir web sitesi için ihtiyacınız olan her şey.",
		hero_description:
			"Bir sonraki büyük SaaS için bir şablon. Birden fazla sayfa ve bölüm, blog, i18n, animasyonlar, CMS — hepsi kullanıma hazır.",
		back_to_all_posts: "Tüm yazılara dön",
		updated: "Güncellendi",
		nav_download: "İndir",
		nav_about: "Hakkımızda",
		nav_games: "Oyunlar",
	},
	da: {
		hero_text: "Alt hvad du behøver til en fantastisk hjemmeside.",
		hero_description:
			"En skabelon til den næste store SaaS. Flere sider og sektioner, blog, i18n, animationer, CMS — alt er klar til brug.",
		back_to_all_posts: "Tilbage til alle indlæg",
		updated: "Opdateret",
		nav_download: "Download",
		nav_about: "Om os",
		nav_games: "Spil",
	},
	nb: {
		hero_text: "Alt du trenger for et fantastisk nettsted.",
		hero_description:
			"En mal for den neste store SaaS-en. Flere sider og seksjoner, blogg, i18n, animasjoner, CMS — alt er klart til bruk.",
		back_to_all_posts: "Tilbake til alle innlegg",
		updated: "Oppdatert",
		nav_download: "Last ned",
		nav_about: "Om oss",
		nav_games: "Spill",
	},
	fi: {
		hero_text: "Kaikki mitä tarvitset upeaan verkkosivustoon.",
		hero_description:
			"Pohja seuraavalle huippu-SaaS:lle. Useita sivuja ja osioita, blogi, i18n, animaatiot, CMS — kaikki valmiina käyttöön.",
		back_to_all_posts: "Takaisin kaikkiin julkaisuihin",
		updated: "Päivitetty",
		nav_download: "Lataa",
		nav_about: "Tietoa",
		nav_games: "Pelit",
	},
	nl: {
		hero_text: "Alles wat je nodig hebt voor een geweldige website.",
		hero_description:
			"Een sjabloon voor de volgende topper-SaaS. Meerdere pagina's en secties, blog, i18n, animaties, CMS — alles direct klaar voor gebruik.",
		back_to_all_posts: "Terug naar alle berichten",
		updated: "Bijgewerkt",
		nav_download: "Downloaden",
		nav_about: "Over ons",
		nav_games: "Spellen",
	},
	uk: {
		hero_text: "Усе, що потрібно для чудового вебсайту.",
		hero_description:
			"Шаблон для наступного хітового SaaS. Кілька сторінок і розділів, блог, i18n, анімації, CMS — усе готове до роботи.",
		back_to_all_posts: "Повернутися до всіх дописів",
		updated: "Оновлено",
		nav_download: "Завантажити",
		nav_about: "Про нас",
		nav_games: "Ігри",
	},
} as const;

/**
 * * Route translations are used to translate route names for the language switcher component.
 * Useful for SEO; the key must match between languages.
 *
 * ## Examples
 *
 * These routes cover everything after the base domain.
 */
export const routeTranslations = {
	en: {
		aboutKey: "about",
	},
	sv: {
		aboutKey: "om",
	},
	de: {
		aboutKey: "ueber-uns",
	},
	fr: {
		aboutKey: "a-propos",
	},
	it: {
		aboutKey: "chi-siamo",
	},
	pl: {
		aboutKey: "o-nas",
	},
	es: {
		aboutKey: "sobre-nosotros",
	},
	pt: {
		aboutKey: "sobre",
	},
	tr: {
		aboutKey: "hakkimizda",
	},
	da: {
		aboutKey: "om-os",
	},
	nb: {
		aboutKey: "om-oss",
	},
	fi: {
		aboutKey: "tietoa",
	},
	nl: {
		aboutKey: "over-ons",
	},
	uk: {
		aboutKey: "pro-nas",
	},
} as const;
