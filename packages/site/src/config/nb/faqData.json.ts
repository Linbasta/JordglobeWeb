import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Ofte stilte spørsmål",
	items: [
		{
			question: "Hvordan fastsettes grensene?",
			answer: `Vi følger FNs retningslinjer for å være så nøytrale som mulig. Når det er sagt, kan grensetegning være komplisert og henger ikke alltid med den aktuelle situasjonen. Si fra hvis du oppdager noe som ikke ser riktig ut.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
