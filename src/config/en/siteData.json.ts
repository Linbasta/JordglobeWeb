import { type SiteDataProps } from "../types/configDataTypes";

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
	}
};

export default siteData;
