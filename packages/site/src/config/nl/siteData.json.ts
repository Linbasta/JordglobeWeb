import { type SiteDataProps } from "../types/configDataTypes";
import play from "@images/front/play.png";
import learn from "@images/front/learn.png";
import remember from "@images/front/Remember.png";
import contextualMemory from "@images/front/contextual_memory.png";
import spacedRepetition from "@images/front/spaced_repetition.png";
import dualCoding from "@images/front/dual_coding.png";
import methodOfLoci from "@images/front/method_of_loci.png";
import interleaving from "@images/front/interleaving.png";
import casualGaming from "@images/front/casual_gaming.png";

const siteData: SiteDataProps = {
    name: "Jordglobe",
    title: "JordGlobe – het ultieme aardrijkskundespel",
    description: "JordGlobe gebruikt verslavende game-mechanieken om aardrijkskunde leren leuk en eenvoudig te maken.",

    contact: {
        address1: "Box 92138",
        address2: "121 62 Johanneshov",
        phone: "",
        email: "info@jordglobe.com",
    },

    author: {
        name: "Jordglobe",
        email: "info@jordglobe.com",
        twitter: "ollelandin",
    },

    defaultImage: {
        src: "/images/share_image.jpg",
        alt: "JordGlobe – het ultieme aardrijkskundespel",
    },

    heroDownload: {
        title: "Speel Jordglobe",
        description: "Download Jordglobe en begin je reis!",
        appStoreAlt: "Download in de App Store",
        googlePlayAlt: "Beschikbaar op Google Play",
    },

    heroSide: {
        title: "Word lid van een gemeenschap van enthousiaste leerlingen",
        description: "Wissel beproefde memoriseertechnieken uit, deel ideeën en krijg vroege toegang tot nieuwe versies en exclusieve functies, zoals de mogelijkheid om je eigen quizzen te maken.",
        communityCtaText: "Word lid van onze gemeenschap",
        imageAlt: "hero van het programma",
    },

    featureBento: {
        badgeText: "Leer al spelend",
        sectionTitle: "De Duolingo van aardrijkskunde",
        card1Title: "Landen en vlaggen",
        card1Description: "Beheers landen en vlaggen — de basiskennis die je helpt het nieuws, internationale gebeurtenissen en de veranderende wereldkaart beter te begrijpen. Verdwaal nooit meer in het nieuws.",
        card1ImageAlt: "landen en vlaggen",
        card1ImageAltLight: "landen en vlaggen licht",
        card2Title: "Regio's en steden",
        card2Description: "Leer steden en regio's kennen, zodat je begrijpt waar dingen gebeuren en waarom het ertoe doet. Van economische knooppunten tot geopolitieke brandhaarden — plaatsen kennen helpt je internationale verhoudingen te doorgronden.",
        card2ImageAlt: "regio's en steden",
        card3Title: "Quiz over grenzen heen",
        card3Description: "Daag jezelf uit met leuke vragen die verder reiken dan alleen aardrijkskunde. Ontdek verrassende feiten die de verborgen verbanden tussen mensen en plaatsen onthullen — elk hoekje van de aardbol is met elkaar verbonden.",
        card3ImageAlt: "quiz verder dan aardrijkskunde",
        ctaSrText: "Begin je wereldreis",
        learnMoreText: "Begin met ontdekken",
        paymentInfoText: "Word een kennismeester",
    },

    featureThreeImage: {
        title: "Speel --> Leer --> Onthoud",
        cards: [
            {
                title: "SPEEL",
                text: `JordGlobe is een casual game die de wereld leren leuk en natuurlijk maakt. Boeiende game-mechanieken veranderen schermtijd in waardevolle momenten.`,
                image: play,
            },
            {
                title: "LEER",
                text: `Het spel past zich aan je niveau aan en helpt je leren van je fouten. Complexe onderwerpen zoals de 50 Amerikaanse staten worden behapbaar in korte sessies. Vragen worden strategisch herhaald en richten zich op wat jij moet beheersen.`,
                image: learn,
            },
            {
                title: "ONTHOUD",
                text: `Geheugenmedailles belonen je langetermijngeheugen door je te testen met optimale tussenpozen. Bij elk succes wordt de afstand tussen herhalingen groter. Veranker kennis voor jaren met minimale moeite.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Memoriseertechnieken",
    featureCardsSmall2: [
        {
            title: "Loci-methode",
            text: `Maak van de aardbol je eigen geheugenpaleis. Elke plek wordt een krachtig anker voor kennis en aardrijkskunde verandert in een natuurlijke geheugenkaart.`,
            image: methodOfLoci,
        },
        {
            title: "Contextueel geheugen",
            text: `Hoe meer nieuwe kennis verbonden is met bestaande herinneringen, hoe makkelijker er een blijvende herinnering van wordt.`,
            image: contextualMemory,
        },
        {
            title: "Gespreide herhaling",
            text: `Herhaal kennis met steeds langere tussenpozen en bouw blijvende herinneringen op met minimale moeite.`,
            image: spacedRepetition,
        },
        {
            title: "Dubbele codering",
            text: `Je leert beter wanneer kennis tegelijk in meerdere vormen wordt aangeboden (bijv. beeld, tekst en kaart).`,
            image: dualCoding,
        },
        {
            title: "Afwisselend leren",
            text: `Je onthoudt beter wanneer je kennis in verschillende contexten moet toepassen.`,
            image: interleaving,
        },
        {
            title: "Casual gaming",
            text: `Beloningen, animaties en spelontwerp maken leren verslavend.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Reacties van gebruikers",
    testimonialsDescription: "Wat gebruikers zeggen over JordGlobe",

    featureVideo: {
        title: "Speelvideo",
        playButtonAriaLabel: "video afspelen",
        imageAlt: "trailer",
    },
};

export default siteData;
