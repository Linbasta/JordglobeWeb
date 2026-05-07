import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Часті запитання",
	items: [
		{
			question: "Як визначаються кордони?",
			answer: `Ми дотримуємось рекомендацій ООН, щоб бути максимально нейтральними. Однак визначення кордонів може бути складним і не завжди відображає поточну ситуацію. Повідомте нас, якщо помітите щось неточне.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
