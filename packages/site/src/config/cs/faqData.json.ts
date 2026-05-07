import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Často kladené otázky",
	items: [
		{
			question: "Jak jsou určovány hranice?",
			answer: `Řídíme se doporučeními OSN, abychom byli co nejvíce neutrální. Vymezování hranic však může být složité a ne vždy přesně odráží aktuální situaci. Dejte nám vědět, pokud zjistíte něco nepřesného.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
