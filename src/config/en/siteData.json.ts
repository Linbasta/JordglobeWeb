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
	title: "JordGlobe - the ultimate geography game",
	description: "JordGlobe uses addictive gaming to make learning geography fun and effortless.",

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
		alt: "JordGlobe logo",
	},

	heroDownload: {
		title: "Play Jordglobe",
		description: "Download Jordglobe here and start your journey!",
		appStoreAlt: "Download on the App Store",
		googlePlayAlt: "Get it on Google Play"
	},

	featureBento: {
		badgeText: "Learning Made Fun",
		sectionTitle: "The Duolingo for Geography",
		card1Title: "Countries & Flags",
		card1Description: "Master countries and their flags - essential knowledge that helps you better understand global news, international events, and the changing world map. Never feel lost in world news again.",
		card1ImageAlt: "countries and flags",
		card1ImageAltLight: "countries and flags light",
		card2Title: "Provinces & Cities",
		card2Description: "Learn about cities and regions to grasp where events happen and why they matter. From economic powerhouses to geopolitical hotspots, knowing locations helps you understand international relations and global developments.",
		card2ImageAlt: "provinces and cities",
		card3Title: "Trivia Beyond Borders",
		card3Description: "Challenge yourself with fun trivia that goes beyond mere geography. Uncover surprising facts that reveal hidden links between people and places, reminding you that every corner of the world is interconnected.",
		card3ImageAlt: "trivia beyond geography",
		ctaSrText: "Start your global journey",
		learnMoreText: "Begin exploring",
		paymentInfoText: "Become a knowledge master",
	},

	featureThreeImage: {
		title: "Play --> Learn --> Remember",
		cards: [
			{
				title: "PLAY",
				text: `JordGlobe is a casual game that makes learning about our world fun and effortless. Its addictive gaming mechanics transform casual gaming into meaningful screen time.`,
				image: play,
			},
			{
				title: "LEARN",
				text: `The game adapts to your skill level and helps you learn from mistakes. Complex topics like the 50 US states become manageable through bite-sized sessions. The game repeats questions strategically, focusing on what you need to master.`,
				image: learn,
			},
			{
				title: "REMEMBER",
				text: `Memory Medals reward long-term retention by challenging you at optimal intervals. With each successful challenge, the time between repetitions increases. Master knowledge permanently with minimal effort.`,
				image: remember,
			}],
	},
	featureCardsTitle: "Mnemonic Techniques",
	featureCardsSmall2: [
		{
			title: "Method of Loci",
			text: `Transform the world globe into your memory palace. Each location becomes a powerful anchor for knowledge, turning geography into a natural memory map.`,
			image: methodOfLoci,
		},
		{
			title: "Contextual Memory",
			text: `The more connections new knowledge has to existing memories, the easier it is to create a lasting memory.`,
			image: contextualMemory,
		},
		{
			title: "Spaced Repetition",
			text: `Repeat knowledge at increasing intervals to build lasting memories with minimal effort.`,
			image: spacedRepetition,
		},
		{
			title: "Dual Coding",
			text: `You learn better when knowledge is presented in multiple formats at once (e.g., image, text, and map).`,
			image: dualCoding,
		},
		{
			title: "Interleaving",
			text: `We remember things better when we are forced to apply new knowledge in various contexts.`,
			image: interleaving,
		},
		{
			title: "Casual Gaming",
			text: `Rewards, animations, and game design make learning addictive.`,
			image: casualGaming,
		}
	],

	testimonialsTitle: "User feedback",
	testimonialsDescription: "What our users say about JordGlobe",

	// Added featureVideo properties
	featureVideo: {
		title: "Gameplay video",
		playButtonAriaLabel: "play video",
		imageAlt: "trailer",
	},
};

export default siteData;
