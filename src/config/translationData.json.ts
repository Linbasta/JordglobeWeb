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
const supportedLangs = ['en', 'sv', 'fr'];

// Use static glob imports for each supported language
const modulesMap: Record<string, Record<string, any>> = {
	en: import.meta.glob('./en/*.json.ts', { eager: true }),
	sv: import.meta.glob('./sv/*.json.ts', { eager: true }),
	fr: import.meta.glob('./fr/*.json.ts', { eager: true }),
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
console.log(dataTranslations)
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
	},
	sv: {
		hero_text: "Allt du behöver för en fantastisk webbplats.",
		hero_description:
			"En mall för nästa stora SaaS. Flera sidor och sektioner, blogg, i18n, animationer, CMS - allt redo att gå.",
		back_to_all_posts: "Till alla inlägg",
		updated: "Uppdaterad",
	},
// Added French translations
	fr: {
		hero_text: "Tout ce dont vous avez besoin pour un site web incroyable.",
		hero_description:
			"Un modèle pour le prochain SaaS phare. Plusieurs pages et sections, blog, i18n, animations, CMS - tout prêt à l'emploi.",
		back_to_all_posts: "Retour à tous les articles",
		updated: "Mis à jour",
	}
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
	fr: {
		aboutKey: "about",
	},

} as const;
