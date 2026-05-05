import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Häufig gestellte Fragen",
	items: [
		{
			question: "Wie werden die Grenzen festgelegt?",
			answer: `Wir folgen den Richtlinien der Vereinten Nationen, um so neutral wie möglich zu bleiben. Trotzdem können Grenzverläufe komplex sein und der aktuellen Lage gelegentlich hinterherhinken. Bitte melde dich, wenn dir etwas auffällt.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
