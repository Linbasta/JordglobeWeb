import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Frequently Asked Questions",
	items: [
		{
			question: "How are the borders determined?",
			answer: `We follow United Nations guidelines to stay as neutral as possible. That said, border delineations can be complex and may occasionally lag behind current situations. Please contact us if you spot any issues.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
