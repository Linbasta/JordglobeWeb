import { type SiteDataProps } from "../types/configDataTypes";
import image1 from "@images/device.jpg";
import image2 from "@images/woman4.jpg";
import image3 from "@images/stock.jpg";



// Update this file with your site specific information
const siteData: SiteDataProps = {
	name: "Jordglobe",
	// Your website's title and description (meta fields)
	title: "JordGlobe - the best geography game in the world",
	description:
		"JordGlobe is a casual game with a 3D Globe & visual effects that harnesses addictive gaming mechanics for good. While playing feels effortless, mastering the game naturally leads to learning about our world - turning casual gaming into meaningful screen time.",

	// used on contact page and footer
	contact: {
		address1: "1234 Main Street",
		address2: "New York, NY 10001",
		phone: "(123) 456-7890",
		email: "creator@cosmicthemes.com",
	},

	// Your information for blog post purposes
	author: {
		name: "Cosmic Themes",
		email: "creator@cosmicthemes.com",
		twitter: "ollelandin",
	},

	// default image for meta tags if the page doesn't have an image already
	defaultImage: {
		src: "/images/jordglobe-logo.png",
		alt: "JordGlobe logo",
	},

	// Localization for FeatureBento component
	featureBento: {
		badgeText: "It's the best",
		sectionTitle: "Boost your brand's visibility and reach with Novaaa",
		card1Title: "Live chat technology",
		card1Description: "Create an on-brand home for your product and reduce design time. Use this table to compare your product.",
		card1ImageAlt: "email",
		card1ImageAltLight: "email light",
		card2Title: "Receive feedbacks",
		card2Description: "Create an on-brand home for your product and reduce design time. Use this table to compare your product.",
		card2ImageAlt: "feedback",
		card3Title: "Secured payment",
		card3Description: "Create an on-brand home for your product and reduce design time. Use this table to compare your product.",
		card3ImageAlt: "payment received",
		ctaSrText: "TSConfig path aliases setup",
		learnMoreText: "Learn more",
		paymentInfoText: "Made $489.00 payment for Netflix"
	},

	featureThreeImage: [
		{
			title: "Real-time insightss",
			text: `Data syncs across your team instantly. Real-time access, with 99.9% uptime.`,
			image: image1,
		},
		{
			title: "Connect all our contacts",
			text: `Sync with your calendar apps and contacts. Google, Outlook, ProtonMail, and more.`,
			image: image2,
		},
		{
			title: "Dashboards for all businesses",
			text: `Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugit totam delectus rerum.`,
			image: image3,
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
