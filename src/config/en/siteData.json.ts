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
};

export default siteData;
