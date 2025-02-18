// site data types
export interface FeatureBentoProps {
	badgeText: string;
	sectionTitle: string;
	card1Title: string;
	card1Description: string;
	card1ImageAlt: string;
	card1ImageAltLight: string;
	card2Title: string;
	card2Description: string;
	card2ImageAlt: string;
	card3Title: string;
	card3Description: string;
	card3ImageAlt: string;
	ctaSrText: string;
	learnMoreText: string;
	paymentInfoText: string;
}

export interface SiteDataProps {
	name: String;
	title: string;
	description: string;
	contact: {
		// used for contact page and footer
		address1: string; // contact address (line 1)
		address2: string; // contact address (line 2)
		phone: string; // contact phone number
		email: string; // contact email address
	};
	author: {
		// used for blog post purposes
		name: string;
		email: string;
		twitter: string; // used for twitter cards when sharing a blog post on twitter
	};
	defaultImage: {
		src: string;
		alt: string;
	};
	// Added localization for FeatureBento component
	featureBento: FeatureBentoProps;
	featureThreeImage: FeatureDataThreeImages;
	featureCardsSmall2: FeatureDataCards2Small2[];
}

// --------------------------------------------------------
// nav data types
export interface navLinkItem {
	text: string;
	link: string;
	newTab?: boolean; // adds target="_blank" rel="noopener noreferrer" to link
	icon?: string; // adds an icon to the left of the text
}

export interface navDropdownItem {
	text: string;
	dropdown: navLinkItem[];
}

export interface navMegaDropdownColumn {
	title: string;
	items: navLinkItem[];
}

export interface navMegaDropdownItem {
	text: string;
	megaMenuColumns: navMegaDropdownColumn[];
}

export type navItem = navLinkItem | navDropdownItem | navMegaDropdownItem;

// --------------------------------------------------------
// faq data types
export interface FaqItem {
	question: string; // this is the question of the accordion
	answer: string; // these are the details seen after expanding the accordion
}

// --------------------------------------------------------
// testimonial data types
export interface TestimonialItem {
	avatar: ImageMetadata; // an imported image
	name: string;
	title: string;
	testimonial: string;
}

// --------------------------------------------------------
// team data types
export interface teamMember {
	image: ImageMetadata; // an imported image
	name: string;
	title: string;
	bio: string;
}

// --------------------------------------------------------
// site settings types
export interface SiteSettingsProps {
	useViewTransitions?: boolean;
	useAnimations?: boolean;
}// site data types
export interface SiteDataProps {
	name: String;
	title: string;
	description: string;
	contact: {
		// used for contact page and footer
		address1: string; // contact address (line 1)
		address2: string; // contact address (line 2)
		phone: string; // contact phone number
		email: string; // contact email address
	};
	author: {
		// used for blog post purposes
		name: string;
		email: string;
		twitter: string; // used for twitter cards when sharing a blog post on twitter
	};
	defaultImage: {
		src: string;
		alt: string;
	};
}

// --------------------------------------------------------
// nav data types
export interface navLinkItem {
	text: string;
	link: string;
	newTab?: boolean; // adds target="_blank" rel="noopener noreferrer" to link
	icon?: string; // adds an icon to the left of the text
}

export interface navDropdownItem {
	text: string;
	dropdown: navLinkItem[];
}

export interface navMegaDropdownColumn {
	title: string;
	items: navLinkItem[];
}

export interface navMegaDropdownItem {
	text: string;
	megaMenuColumns: navMegaDropdownColumn[];
}

export type navItem = navLinkItem | navDropdownItem | navMegaDropdownItem;

// --------------------------------------------------------
// faq data types
export interface FaqItem {
	question: string; // this is the question of the accordion
	answer: string; // these are the details seen after expanding the accordion
}

// --------------------------------------------------------
// testimonial data types
export interface TestimonialItem {
	avatar?: ImageMetadata | string | null;
	name: string;
	title: string;
	testimonial: string;
}

// --------------------------------------------------------
// team data types
export interface teamMember {
	image: ImageMetadata; // an imported image
	name: string;
	title: string;
	bio: string;
}

// --------------------------------------------------------
// site settings types
export interface SiteSettingsProps {
	useViewTransitions?: boolean;
	useAnimations?: boolean;
}

export interface ThreeImageCard {
	title: string;
	text: string;
	image: ImageMetadata;
}

export interface FeatureDataThreeImages {
	title: string;
	cards: ThreeImageCard[];
}

export interface FeatureDataCards2Small2 {
	title: string;
	text: string;
}

export interface SiteDataProps {
	// ...existing code...
	featureBento: FeatureBentoProps;
	featureThreeImage: FeatureDataThreeImages[];
	featureCardsSmall2: FeatureDataCards2Small2[];
}
