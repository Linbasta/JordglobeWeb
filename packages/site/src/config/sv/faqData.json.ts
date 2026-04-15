import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Vanliga frågor",
	items: [
		{
			question: "Hur bestäms gränserna?",
			answer: `Vi följer FN:s riktlinjer för att förbli så neutrala som möjligt. Det sagt kan gränsdragningar vara komplexa och ibland ligga efter aktuella situationer. Vänligen kontakta oss om du upptäcker några problem.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
