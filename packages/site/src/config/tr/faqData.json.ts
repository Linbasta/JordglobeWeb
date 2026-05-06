import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Sıkça sorulan sorular",
	items: [
		{
			question: "Sınırlar nasıl belirleniyor?",
			answer: `Mümkün olduğunca tarafsız kalmak için Birleşmiş Milletler'in yönergelerini takip ediyoruz. Bununla birlikte sınırları tanımlamak karmaşık olabilir ve bazen güncel duruma ayak uyduramayabilir. Yerinde durmayan bir şey görürseniz lütfen bize bildirin.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
