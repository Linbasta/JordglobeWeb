/**
 * Global site settings
 */

import { type SiteSettingsProps } from "./types/configDataTypes";

// The below locales need to match what you've put in your `astro.config.mjs` file
export const locales = ["en", "sv", "de", "fr", "it", "pl", "es", "pt", "tr", "da", "nb", "fi", "nl", "uk", "cs"] as const;
export const defaultLocale = "en" as const;

// localeMap is used to map languages to their respective locales - used for formatDate function
export const localeMap = {
	en: "en-US",
	sv: "sv-SE",
	de: "de-DE",
	fr: "fr-FR",
	it: "it-IT",
	pl: "pl-PL",
	es: "es-ES",
	pt: "pt-BR",
	tr: "tr-TR",
	da: "da-DK",
	nb: "nb-NO",
	fi: "fi-FI",
	nl: "nl-NL",
	uk: "uk-UA",
	cs: "cs-CZ",
} as const;

// text to show in the language switcher for each locale
export const languageSwitcherMap = {
	en: "EN",
	sv: "SV",
	de: "DE",
	fr: "FR",
	it: "IT",
	pl: "PL",
	es: "ES",
	pt: "PT",
	tr: "TR",
	da: "DA",
	nb: "NB",
	fi: "FI",
	nl: "NL",
	uk: "UK",
	cs: "CS",
} as const;

// native language names shown in the expanded language list
export const languageNameMap = {
	en: "English",
	sv: "Svenska",
	de: "Deutsch",
	fr: "Français",
	it: "Italiano",
	pl: "Polski",
	es: "Español",
	pt: "Português",
	tr: "Türkçe",
	da: "Dansk",
	nb: "Norsk bokmål",
	fi: "Suomi",
	nl: "Nederlands",
	uk: "Українська",
	cs: "Čeština",
} as const;

// site settings that don't change between languages
export const siteSettings: SiteSettingsProps = {
	useViewTransitions: true,
	useAnimations: true,
};

export default siteSettings;
