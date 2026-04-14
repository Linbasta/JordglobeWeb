import { type CollectionEntry } from "astro:content";

// utils
import { getTranslatedData } from "@js/translationUtils";
import { defaultLocale } from "@config/siteSettings.json";

// data - siteData.title should not change based on locale so this should be fine
const siteData = getTranslatedData("siteData", defaultLocale);

interface GeneralProps {
	type: "general";
}

export interface BlogProps {
	type: "blog";
	postFrontmatter: CollectionEntry<"blog">["data"];
	image: any; // result of getImage() from Seo.astro
	authors: CollectionEntry<"authors">[];
	canonicalUrl: URL;
}

export interface AppProps {
	type: "app";
}

export type JsonLDProps = BlogProps | GeneralProps | AppProps;

/**
 * Generates Organization schema for the site
 */
export function organizationSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		"name": "Jordglobe",
		"url": import.meta.env.SITE,
		"logo": `${import.meta.env.SITE}/images/jordglobe-logo.png`,
		"email": siteData.contact?.email || "info@jordglobe.com",
		"sameAs": [
			"https://twitter.com/ollelandin"
		],
		"address": {
			"@type": "PostalAddress",
			"streetAddress": siteData.contact?.address1 || "Box 92138",
			"addressLocality": "Johanneshov",
			"postalCode": "121 62",
			"addressCountry": "SE"
		}
	};
}

/**
 * Generates SoftwareApplication schema for app download pages
 */
export function softwareApplicationSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "JordGlobe",
		"applicationCategory": "GameApplication",
		"operatingSystem": "iOS, Android",
		"description": siteData.description || "JordGlobe uses addictive gaming to make learning geography fun and effortless.",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD"
		},
		"aggregateRating": {
			"@type": "AggregateRating",
			"ratingValue": "4.6",
			"ratingCount": "93"
		}
	};
}

/**
 * Generates BreadcrumbList schema
 */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		"itemListElement": items.map((item, index) => ({
			"@type": "ListItem",
			"position": index + 1,
			"name": item.name,
			"item": item.url
		}))
	};
}

export interface VideoGameSchemaProps {
	name: string;
	description: string;
	url: string;
	image?: string;
	genre?: string;
	playMode?: string;
}

/**
 * Generates VideoGame schema for browser-based games
 */
export function videoGameSchema(game: VideoGameSchemaProps) {
	return {
		"@context": "https://schema.org",
		"@type": "VideoGame",
		"name": game.name,
		"description": game.description,
		"url": game.url,
		"image": game.image,
		"genre": game.genre || "Quiz",
		"gamePlatform": "Web Browser",
		"playMode": game.playMode || "SinglePlayer",
		"applicationCategory": "Game",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD",
			"availability": "https://schema.org/InStock"
		},
		"publisher": {
			"@type": "Organization",
			"name": "Jordglobe",
			"url": import.meta.env.SITE
		}
	};
}

export default function jsonLDGenerator(props: JsonLDProps) {
	const { type } = props;
	if (type === "blog") {
		const { postFrontmatter, image, authors, canonicalUrl } = props as BlogProps;

		let authorsJsonLdArray = authors.map((author) => {
			return {
				"@type": "Person",
				name: author.data.name,
				url: author.data.authorLink,
			};
		});

		let authorsJsonLd;

		if (authorsJsonLdArray.length === 1) {
			authorsJsonLd = authorsJsonLdArray[0];
		} else {
			authorsJsonLd = authorsJsonLdArray;
		}

		return `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Blogposting",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "${canonicalUrl}"
        },
        "headline": "${postFrontmatter.title}",
        "description": "${postFrontmatter.description}",
        "image": "${image.src}",
        "author": ${JSON.stringify(authorsJsonLd)},
        "datePublished": "${postFrontmatter.pubDate}",
        "dateModified": "${postFrontmatter.updatedDate}"
      }
    </script>`;
	}

	if (type === "app") {
		// Return both Organization and SoftwareApplication schemas for app pages
		return `<script type="application/ld+json">
${JSON.stringify(organizationSchema(), null, 2)}
    </script>
    <script type="application/ld+json">
${JSON.stringify(softwareApplicationSchema(), null, 2)}
    </script>`;
	}

	// General pages: include WebSite and Organization schemas
	return `<script type="application/ld+json">
      {
      "@context": "https://schema.org/",
      "@type": "WebSite",
      "name": "${siteData.title}",
      "url": "${import.meta.env.SITE}"
      }
    </script>
    <script type="application/ld+json">
${JSON.stringify(organizationSchema(), null, 2)}
    </script>`;
}
