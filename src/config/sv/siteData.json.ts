import { type SiteDataProps } from "../types/configDataTypes";
import play from "@images/front/play.jpg";
import learn from "@images/front/learn.png";
import remember from "@images/front/Remember.png";

// Update this file with your site specific information
const siteData: SiteDataProps = {
	name: "Jordglobe",
	// Your website's title and description (meta fields)
	title: "JordGlobe - det ultimata geographiespelet",
	description: "JordGlobe använder beroendeframkallande spelmekanik för att göra geografi roligt och enkelt att lära sig.",

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
		alt: "JordGlobe logotyp",
	},


	featureBento: {
		badgeText: "Lärande har kul",
		sectionTitle: "Duolingo för geografi",
		card1Title: "Länder & Flaggor",
		card1Description: "Bemästra länder och deras flaggor - grundläggande kunskap som hjälper dig att förstå globala nyheter, internationella händelser och den föränderliga världskartan. Känn dig aldrig vilse i världens nyheter igen.",
		card1ImageAlt: "länder och flaggor",
		card1ImageAltLight: "länder och flaggor ljus",
		card2Title: "Provinser & Städer",
		card2Description: "Lär dig om städer och regioner för att förstå var händelser sker och varför de är viktiga. Från ekonomiska maktcentra till geopolitiska hotspots, att känna till platser hjälper dig att förstå internationella relationer och globala utvecklingar.",
		card2ImageAlt: "provinser och städer",
		card3Title: "Trivia bortom gränser",
		card3Description: "Utmanar dig själv med rolig trivia som går bortom enbart geografi. Avslöja överraskande fakta som visar dolda samband mellan människor och platser, och påminner dig om att varje hörn i världen är sammankopplat.",
		card3ImageAlt: "trivia bortom geografi",
		ctaSrText: "Börja din globala resa",
		learnMoreText: "Börja utforska",
		paymentInfoText: "Bli en kunskapsexpert",
	},

	featureThreeImage: {
		title: "Spela --> Lär --> Kom ihåg",
		cards: [
			{
				title: "SPELA",
				text: `JordGlobe är ett avslappnat spel som gör det roligt och enkelt att lära sig om vår värld. Dess beroendeframkallande spelmekanik förvandlar avslappnat spelande till meningsfull skärmtid.`,
				image: play,
			},
			{
				title: "LÄR",
				text: `Spelet anpassar sig efter din färdighetsnivå och hjälper dig att lära dig av dina misstag. Komplexa ämnen som de 50 amerikanska delstaterna blir hanterbara genom korta sessioner. Spelet upprepar frågor strategiskt med fokus på det du behöver bemästra.`,
				image: learn,
			},
			{
				title: "KOM IHÅG",
				text: `Minnesmedaljer belönar långsiktig inlärning genom att utmana dig med optimala intervaller. Med varje lyckad utmaning ökar tiden mellan repetitionerna. Bemästra kunskap permanent med minimal ansträngning.`,
				image: remember,
			}],
	},
	featureCardsTitle: "Minnestekniker",
	featureCardsSmall2: [
		{
			title: "Loci-metoden",
			text: `Förvandla jordgloben till ditt minnespalats. Varje plats blir ett starkt ankare för kunskap, och gör geografin till en naturlig minneskarta.`,
		},
		{
			title: "Kontextuellt minne",
			text: `Ju fler kopplingar ny kunskap har till befintliga minnen, desto lättare är det att skapa ett varaktigt minne.`,
		},
		{
			title: "Intervallrepetition",
			text: `Repetera kunskap med ökande intervaller för att bygga bestående minnen med minimal ansträngning.`,
		},
		{
			title: "Dubbel kodning",
			text: `Du lär dig bättre när kunskap presenteras i flera format samtidigt (t.ex. bild, text och karta).`,
		},
		{
			title: "Växlande",
			text: `Vi kommer ihåg saker bättre när vi måste tillämpa ny kunskap i olika sammanhang.`,
		},
		{
			title: "Avslappnat spelande",
			text: `Belöningar, animationer och spelupplägg gör lärande beroendeframkallande.`,
		}
	]
};

export default siteData;
