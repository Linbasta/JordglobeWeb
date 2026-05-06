import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Perguntas frequentes",
	items: [
		{
			question: "Como as fronteiras são determinadas?",
			answer: `Seguimos as diretrizes das Nações Unidas para manter o máximo de neutralidade possível. Dito isso, definir fronteiras pode ser complicado e às vezes não acompanha a situação atual. Avise-nos se notar algo que não se encaixa.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
