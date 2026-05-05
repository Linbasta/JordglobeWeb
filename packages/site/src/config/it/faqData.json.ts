import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Domande frequenti",
	items: [
		{
			question: "Come vengono definiti i confini?",
			answer: `Seguiamo le linee guida delle Nazioni Unite per rimanere il più neutrali possibile. Tuttavia, i confini possono essere complessi e occasionalmente non riflettere la situazione attuale. Segnalacelo se noti qualcosa.`,
		},
	],
};

export default faq;
