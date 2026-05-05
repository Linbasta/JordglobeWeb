import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Questions fréquentes",
	items: [
		{
			question: "Comment les frontières sont-elles définies ?",
			answer: `Nous suivons les directives des Nations Unies pour rester aussi neutres que possible. Cela dit, le tracé des frontières peut être complexe et parfois en retard sur la situation actuelle. N'hésitez pas à nous contacter si vous repérez quelque chose.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
