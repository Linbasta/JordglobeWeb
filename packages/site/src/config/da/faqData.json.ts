import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Ofte stillede spørgsmål",
	items: [
		{
			question: "Hvordan fastlægges grænserne?",
			answer: `Vi følger De Forenede Nationers retningslinjer for at være så neutrale som muligt. Når det er sagt, kan grænsedragning være kompliceret og holder ikke altid trit med den aktuelle situation. Sig til, hvis du opdager noget, der ikke ser rigtigt ud.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
