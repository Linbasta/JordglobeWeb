import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Usein kysytyt kysymykset",
	items: [
		{
			question: "Miten rajat määritetään?",
			answer: `Noudatamme YK:n ohjeita ollaksemme mahdollisimman puolueettomia. Rajojen vetäminen voi kuitenkin olla monimutkaista, eikä se aina pysy nykytilanteen tasalla. Kerro, jos huomaat jotain, mikä ei näytä oikealta.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
