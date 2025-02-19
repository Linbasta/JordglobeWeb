import { type SiteDataProps } from "../types/configDataTypes";
import play from "@images/front/play.jpg";
import learn from "@images/front/learn.png";
import remember from "@images/front/Remember.png";
import contextualMemory from "@images/front/contextual_memory.jpg";
import spacedRepetition from "@images/front/spaced_repetition.jpg";
import dualCoding from "@images/front/dual_coding.jpg";
import methodOfLoci from "@images/front/method_of_loci.jpg";
import interleaving from "@images/front/itearleaving.jpg";
import casualGaming from "@images/front/casual_gaming.jpg";



// Update this file with your site specific information
const siteData: SiteDataProps = {
	name: "Jordglobe",
	// Your website's title and description (meta fields)
	title: "JordGlobe - le jeu de géographie ultime",
	description: "JordGlobe utilise des jeux addictifs pour rendre l'apprentissage de la géographie amusant et sans effort.",

	// used on contact page and footer
	contact: {
		address1: "Box 92138",
		address2: "121 62 Johanneshov",
		phone: "",
		email: "info@jordglobe.com",
	},

	// Your information for blog post purposes
	author: {
		name: "Jordglobe",
		email: "info@jordglobe.com",
		twitter: "ollelandin",
	},

	// default image for meta tags if the page doesn't have an image already
	defaultImage: {
		src: "/images/jordglobe-logo.png",
		alt: "Logo JordGlobe",
	},


	featureBento: {
		badgeText: "Apprentissage Amusant",
		sectionTitle: "Le Duolingo de la Géographie",
		card1Title: "Pays & Drapeaux",
		card1Description: "Maîtrisez les pays et leurs drapeaux - des connaissances essentielles qui vous aident à mieux comprendre les actualités mondiales, les événements internationaux et la carte du monde en constante évolution. Ne vous sentez plus jamais perdu dans les actualités mondiales.",
		card1ImageAlt: "pays et drapeaux",
		card1ImageAltLight: "pays et drapeaux clair",
		card2Title: "Provinces & Villes",
		card2Description: "Apprenez à connaître les villes et les régions pour comprendre où se produisent les événements et pourquoi ils sont importants. Des puissances économiques aux points chauds géopolitiques, connaître les lieux vous aide à comprendre les relations internationales et les développements mondiaux.",
		card2ImageAlt: "provinces et villes",
		card3Title: "Trivia Au-Delà des Frontières",
		card3Description: "Défiez-vous avec des trivia amusants qui vont au-delà de la simple géographie. Découvrez des faits surprenants qui révèlent des liens cachés entre les personnes et les lieux, vous rappelant que chaque coin du monde est interconnecté.",
		card3ImageAlt: "trivia au-delà de la géographie",
		ctaSrText: "Commencez votre voyage mondial",
		learnMoreText: "Commencez à explorer",
		paymentInfoText: "Devenez un maître du savoir",
	},

	featureThreeImage: {
		title: "Jouer --> Apprendre --> Se Souvenir",
		cards: [
			{
				title: "JOUER",
				text: `JordGlobe est un jeu décontracté qui rend l'apprentissage de notre monde amusant et sans effort. Ses mécanismes de jeu addictifs transforment le jeu décontracté en temps d'écran significatif.`,
				image: play,
			},
			{
				title: "APPRENDRE",
				text: `Le jeu s'adapte à votre niveau de compétence et vous aide à apprendre de vos erreurs. Des sujets complexes comme les 50 États américains deviennent gérables grâce à des sessions de taille réduite. Le jeu répète les questions de manière stratégique, en se concentrant sur ce que vous devez maîtriser.`,
				image: learn,
			},
			{
				title: "SE SOUVENIR",
				text: `Les Médailles de Mémoire récompensent la rétention à long terme en vous défiant à des intervalles optimaux. À chaque défi réussi, le temps entre les répétitions augmente. Maîtrisez les connaissances de manière permanente avec un effort minimal.`,
				image: remember,
			}],
	},
	featureCardsTitle: "Techniques Mnémotechniques",
	featureCardsSmall2: [
		{
			title: "Méthode des Loci",
			text: `Transformez le globe terrestre en votre palais de mémoire. Chaque lieu devient une ancre puissante pour les connaissances, transformant la géographie en une carte mémoire naturelle.`,
			image: methodOfLoci,
		},
		{
			title: "Mémoire Contextuelle",
			text: `Plus les nouvelles connaissances ont de connexions avec les souvenirs existants, plus il est facile de créer un souvenir durable.`,
			image: contextualMemory,
		},
		{
			title: "Répétition Espacée",
			text: `Répétez les connaissances à des intervalles croissants pour créer des souvenirs durables avec un effort minimal.`,
			image: spacedRepetition,
		},
		{
			title: "Codage Double",
			text: `Vous apprenez mieux lorsque les connaissances sont présentées sous plusieurs formats à la fois (par exemple, image, texte et carte).`,
			image: dualCoding,
		},
		{
			title: "Entrelacement",
			text: `Nous nous souvenons mieux des choses lorsque nous sommes obligés d'appliquer de nouvelles connaissances dans divers contextes.`,
			image: interleaving,
		},
		{
			title: "Jeu Décontracté",
			text: `Les récompenses, les animations et la conception du jeu rendent l'apprentissage addictif.`,
			image: casualGaming,
		}
	],

	testimonialsTitle: "Avis des utilisateurs",
	testimonialsDescription: "Ce que nos utilisateurs disent de JordGlobe",

	// Added featureVideo properties
	featureVideo: {
		title: "Vidéo de gameplay",
		playButtonAriaLabel: "lire la vidéo",
		imageAlt: "bande-annonce",
	},
};

export default siteData;
