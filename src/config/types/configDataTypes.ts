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
	name: string; // updated type
	title: string;
	description: string;
	contact: {
		address1: string;
		address2: string;
		phone: string;
		email: string;
	};
	author: {
		name: string;
		email: string;
		twitter: string;
	};
	defaultImage: {
		src: string;
		alt: string;
	};
	featureBento: FeatureBentoProps;
	featureThreeImage: FeatureDataThreeImages; // now an object, not an array
	featureCardsSmall2: FeatureDataCards2Small2[];
	featureCardsTitle: string;
	testimonialsTitle: string; // new property
	testimonialsDescription: string; // new property
	// Added featureVideo property
	featureVideo: {
		title: string;
		playButtonAriaLabel: string;
		imageAlt: string;
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
	title: string;
	items: {
		question: string; // this is the question of the accordion
		answer: string; // these are the details seen after expanding the accordion
	}[];
}

// --------------------------------------------------------
// testimonial data types
export interface TestimonialItem {
	avatar: ImageMetadata; // an imported image
	name: string;
	title: string;
	testimonial: string;
	avatarTintColor?: string; // new: optional tint color for the avatar image
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
