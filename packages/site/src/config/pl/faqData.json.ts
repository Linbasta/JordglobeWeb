import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Najczęściej zadawane pytania",
	items: [
		{
			question: "Jak są wyznaczane granice?",
			answer: `Stosujemy się do wytycznych Organizacji Narodów Zjednoczonych, by zachować jak największą neutralność. To powiedziawszy, wytyczanie granic bywa skomplikowane i czasem nie nadąża za bieżącą sytuacją. Daj nam znać, jeśli zauważysz coś niewłaściwego.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
