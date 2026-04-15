import { type SiteDataProps } from "../types/configDataTypes";
import play from "@images/front/play.jpg";
import learn from "@images/front/learn.png";
import remember from "@images/front/Remember.png";
import contextualMemory from "@images/front/contextual_memory.png";
import spacedRepetition from "@images/front/spaced_repetition.png";
import dualCoding from "@images/front/dual_coding.png";
import methodOfLoci from "@images/front/method_of_loci.png";
import interleaving from "@images/front/interleaving.png";
import casualGaming from "@images/front/casual_gaming.png";



// Update this file with your site specific information
const siteData: SiteDataProps = {
	name: "Jordglobe",
	// Your website's title and description (meta fields)
	title: "JordGlobe - det ultimata geografispelet",
	description: "JordGlobe använder beroendeframkallande spelmekanik för att göra inlärning av geografi roligt och enkelt.",

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
		src: "/images/share_image.jpg",
		alt: "JordGlobe logotyp",
	},

	heroDownload: {
		title: "Spela Jordglobe",
		description: "Ladda ner Jordglobe här och börja din resa!",
		appStoreAlt: "Ladda ner på App Store",
		googlePlayAlt: "Hämta på Google Play"
	},

	// Add new heroSide property derived from HeroSideImage component
	heroSide: {
		title: "Häng med andra livslånga lärande",
		description: "Utbyt beprövade minnesregler, dela dina idéer och få tidig tillgång till nya utgåvor och exklusiva funktioner som att skapa dina egna frågesporter.",
		communityCtaText: "Gå med i vår aktiva gemenskap",
		imageAlt: "hero mjukvara"
	},

	featureBento: {
		badgeText: "Lärande gjort roligt",
		sectionTitle: "Duolingo för Geografi",
		card1Title: "Länder & Flaggor",
		card1Description: "Bemästra länder och deras flaggor - grundläggande kunskap som hjälper dig att bättre förstå globala nyheter, internationella händelser och den föränderliga världskartan. Känn dig aldrig vilsen i världsnyheter igen.",
		card1ImageAlt: "länder och flaggor",
		card1ImageAltLight: "länder och flaggor ljus",
		card2Title: "Provinser & Städer",
		card2Description: "Lär dig om städer och regioner för att förstå var händelser äger rum och varför de är viktiga. Från ekonomiska maktcentrum till geopolitiska brännpunkter, att känna till platser hjälper dig förstå internationella relationer och global utveckling.",
		card2ImageAlt: "provinser och städer",
		card3Title: "Kuriosa Bortom Gränserna",
		card3Description: "Utmana dig själv med rolig kuriosa som går bortom ren geografi. Upptäck överraskande fakta som avslöjar dolda kopplingar mellan människor och platser, och påminner om att varje hörn av världen är sammankopplat.",
		card3ImageAlt: "kuriosa bortom geografi",
		ctaSrText: "Påbörja din globala resa",
		learnMoreText: "Börja utforska",
		paymentInfoText: "Bli en kunskapsmästare",
	},

	featureThreeImage: {
		title: "Spela --> Lär --> Kom ihåg",
		cards: [
			{
				title: "SPELA",
				text: "JordGlobe är ett casual-spel som gör det roligt och enkelt att lära sig om vår värld. Dess beroendeframkallande spelmekanik förvandlar vardagligt spelande till meningsfull skärmtid.",
				image: play,
			},
			{
				title: "LÄR",
				text: "Spelet anpassar sig efter din kunskapsnivå och hjälper dig lära av misstag. Komplexa ämnen som USA:s 50 delstater blir hanterbara genom korta spelsessioner. Spelet upprepar frågor strategiskt med fokus på det du behöver bemästra.",
				image: learn,
			},
			{
				title: "KOM IHÅG",
				text: "Minnesmedaljer belönar långsiktig retention genom att utmana dig vid optimala intervaller. Med varje framgångsrik utmaning ökar tiden mellan repetitionerna. Bemästra kunskap permanent med minimal ansträngning.",
				image: remember,
			}],
	},
	featureCardsTitle: "Minnestekniker",
	featureCardsSmall2: [
		{
			title: "Loci-metoden",
			text: "Förvandla världsgloben till ditt minnespalats. Varje plats blir ett kraftfullt ankare för kunskap, som förvandlar geografi till en naturlig minneskarta.",
			image: methodOfLoci,
		},
		{
			title: "Kontextuellt Minne",
			text: "Ju fler kopplingar ny kunskap har till existerande minnen, desto lättare är det att skapa bestående minnen.",
			image: contextualMemory,
		},
		{
			title: "Intervallinlärning",
			text: "Upprepa kunskap med ökande intervaller för att bygga bestående minnen med minimal ansträngning.",
			image: spacedRepetition,
		},
		{
			title: "Dubbel Kodning",
			text: "Du lär dig bättre när kunskap presenteras i flera format samtidigt (t.ex. bild, text och karta).",
			image: dualCoding,
		},
		{
			title: "Varierad Inlärning",
			text: "Vi kommer ihåg saker bättre när vi tvingas använda ny kunskap i olika sammanhang.",
			image: interleaving,
		},
		{
			title: "Casual Gaming",
			text: "Belöningar, animationer och speldesign gör lärandet beroendeframkallande.",
			image: casualGaming,
		}
	],

	testimonialsTitle: "Användarfeedback",
	testimonialsDescription: "Vad våra användare säger om JordGlobe",

	// Added featureVideo properties
	featureVideo: {
		title: "Trailer",
		playButtonAriaLabel: "spela video",
		imageAlt: "trailer",
	},
};

export default siteData;
