import { type SiteDataProps } from "../types/configDataTypes";
import play from "@images/front/play.jpg";
import learn from "@images/front/learn.png";
import remember from "@images/front/Remember.png";



// Update this file with your site specific information
const siteData: SiteDataProps = {
	name: "Jordglobe",
	// Your website's title and description (meta fields)
	title: "JordGlobe - the best geography game in the world",
	description:
		"JordGlobe is a casual game with a 3D Globe & visual effects that harnesses addictive gaming mechanics for good. While playing feels effortless, mastering the game naturally leads to learning about our world - turning casual gaming into meaningful screen time.",

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



	featureThreeImage: [
		{
			title: "PLAY",
			text: `JordGlobe is a casual game with a 3D Globe & visual effects that harnesses addictive gaming mechanics for good. While playing feels effortless, mastering the game naturally leads to learning about our world - turning casual gaming into meaningful screen time.`,
			image: play,
		},
		{
			title: "LEARN",
			text: `JordGlobe intelligently adapts to your skill. The game reveals the correct answer when you make errors. And those questions are repeated focusing on what you need to learn. Even ambitious goals like learning 50 states of USA can be achieved effortlessly. By dividing the states into bite size game sessions you learn them a few at the time. Before you know it - you can name all the 50 states!`,
			image: learn,
		},
		{
			title: "REMEMBER",
			text: `New knowledge need repetition to stick. The Memory Medals in JordGlobe rewards you for retaining the knowledge. At optimal time points, you are challenged to prove that you still remember. The more challenges you beat, the longer time you can wait before the next repetition. Remember for life with minimum effort!`,
			image: remember,
		},
	],
	featureCardsSmall2: [
		{
			title: "Connect all our contacts",
			text: `Sync with your calendar apps and contacts. Google, Outlook, ProtonMail, and more.`,
		},
		{
			title: "Dashboards for all businesses",
			text: `Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugit totam delectus rerum, reiciendis quisquam cum sunt.`,
		},
		{
			title: "Synced to the cloud",
			text: `Your data is accessible from everywhere, syncing across all your devices.`,
		},
		{
			title: "Your business intelligence, simplified",
			text: `Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugit totam delectus rerum.`,
		},
		{
			title: "Real-time insights at your fingertips",
			text: `Data syncs across your team instantly. Real-time access, with 99.9% uptime.`,
		},
		{
			title: "Connects to popular apps",
			text: `Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugit totam delectus rerum, reiciendis quisquam cum sunt.`,
		},
	]
};

export default siteData;
