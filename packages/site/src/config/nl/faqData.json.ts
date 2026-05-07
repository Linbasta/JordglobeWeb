import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Veelgestelde vragen",
	items: [
		{
			question: "Hoe worden de grenzen bepaald?",
			answer: `We volgen de richtlijnen van de VN om zo neutraal mogelijk te zijn. Dat gezegd hebbende, kan grenstrekking ingewikkeld zijn en loopt het niet altijd in de pas met de actuele situatie. Laat het ons weten als je iets ziet dat niet klopt.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
