import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import compress from "@playform/compress";
import AutoImport from "astro-auto-import";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";
import netlify from "@astrojs/netlify";
import icon from "astro-icon";

import gameUrls from "./src/data/game-urls.json" with { type: "json" };

// https://astro.build/config
export default defineConfig({
	site: "https://jordglobe.com",
	adapter: netlify({
		imageCDN: false,
	}),
	redirects: {
		"/admin": "/keystatic",
	},
	// i18n configuration must match src/config/translations.json.ts
	i18n: {
		defaultLocale: "en",
		locales: ["en", "sv", "de", "fr", "it", "pl", "es", "pt", "tr", "da", "nb", "fi", "nl", "uk", "cs"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	markdown: {
		shikiConfig: {
			// Shiki Themes: https://shiki.style/themes
			theme: "css-variables",
			wrap: false,
		},
	},
	// trailingSlash: "always",
	integrations: [
		// example auto import component into mdx files
		AutoImport({
			imports: [
				// https://github.com/delucis/astro-auto-import
				"@components/Admonition/Admonition.astro",
			],
		}),
		mdx(),
		react(),
		icon(),
		keystatic(),
		sitemap({
			filter: (page) =>
				!page.includes('/404') &&
				!page.includes('/examples/') &&
				!page.includes('/download') &&
				!page.includes('/play') &&
				!page.includes('/medal') &&
				!page.includes('/duel') &&
				!page.includes('/elements') &&
				!page.includes('/gdpr') &&
				!page.includes('/keystatic'),
			// Game pages are built separately and copied during deploy.
			// URLs are generated from packages/games/src/games/manifests.ts
			// via scripts/generate-game-urls.ts (runs as prebuild).
			customPages: gameUrls,
			// i18n hreflang is handled in HTML <head> since game URLs use a
			// suffix pattern (/games/id/sv/) that the sitemap plugin can't pair.
			serialize(item) {
				return { ...item, lastmod: new Date() };
			},
		}),
		compress({
			HTML: true,
			JavaScript: true,
			CSS: true,
			Image: false, // astro:assets handles this. Enabling this can dramatically increase build times
			SVG: false, // astro-icon handles this
		}),
	],

	vite: {
		plugins: [tailwindcss()],
		assetsInclude: ['**/*.m4v', '**/*.mp4'], // Add this line or modify existing assetsInclude
		// stop inlining short scripts to fix issues with ClientRouter: https://github.com/withastro/astro/issues/12804
		build: {
			assetsInlineLimit: 0,
		},
		server: {
			// Allow access from Tailscale Magic DNS hostnames (e.g. ms.tailXXXX.ts.net).
			// Leading dot acts as a suffix wildcard for *.ts.net.
			allowedHosts: ['.ts.net'],
		},
	},
});
