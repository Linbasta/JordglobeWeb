import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Preguntas frecuentes",
	items: [
		{
			question: "¿Cómo se determinan las fronteras?",
			answer: `Seguimos las directrices de las Naciones Unidas para mantener la mayor neutralidad posible. Dicho esto, definir fronteras puede ser complicado y a veces no se mantiene al día con la situación actual. Avísanos si ves algo que no encaja.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
