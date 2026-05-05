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
    title: "JordGlobe – das ultimative Geografiespiel",
    description: "JordGlobe nutzt fesselnde Spielmechanik, damit das Lernen von Geografie Spaß macht und mühelos gelingt.",

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
        alt: "JordGlobe – das ultimative Geografiespiel",
    },

    heroDownload: {
        title: "JordGlobe spielen",
        description: "Lade JordGlobe hier herunter und starte deine Reise!",
        appStoreAlt: "Im App Store laden",
        googlePlayAlt: "Bei Google Play erhältlich",
    },

    heroSide: {
        title: "Triff andere Lebenslang-Lernende",
        description: "Tausche bewährte Eselsbrücken aus, teile deine Ideen und sichere dir frühen Zugang zu neuen Releases und exklusiven Funktionen wie eigenen Quizzen.",
        communityCtaText: "Tritt unserer Community bei",
        imageAlt: "Hero-Software",
    },

    featureBento: {
        badgeText: "Lernen mit Spaß",
        sectionTitle: "Das Duolingo für Geografie",
        card1Title: "Länder & Flaggen",
        card1Description: "Beherrsche Länder und ihre Flaggen – grundlegendes Wissen, das dir hilft, Weltnachrichten, internationale Ereignisse und die sich wandelnde Weltkarte besser zu verstehen. Fühl dich nie wieder verloren in den Nachrichten.",
        card1ImageAlt: "Länder und Flaggen",
        card1ImageAltLight: "Länder und Flaggen hell",
        card2Title: "Provinzen & Städte",
        card2Description: "Lerne Städte und Regionen kennen, um zu verstehen, wo Ereignisse stattfinden und warum sie wichtig sind. Von Wirtschaftsmetropolen bis zu geopolitischen Brennpunkten – Ortskenntnis hilft dir, internationale Beziehungen und globale Entwicklungen zu begreifen.",
        card2ImageAlt: "Provinzen und Städte",
        card3Title: "Wissenswertes jenseits der Grenzen",
        card3Description: "Fordere dich mit lustigen Fragen heraus, die über reine Geografie hinausgehen. Entdecke überraschende Fakten, die verborgene Verbindungen zwischen Menschen und Orten aufzeigen – jeder Winkel der Welt ist verbunden.",
        card3ImageAlt: "Wissenswertes jenseits der Geografie",
        ctaSrText: "Beginne deine globale Reise",
        learnMoreText: "Jetzt entdecken",
        paymentInfoText: "Werde zum Wissensmeister",
    },

    featureThreeImage: {
        title: "Spielen --> Lernen --> Erinnern",
        cards: [
            {
                title: "SPIELEN",
                text: `JordGlobe ist ein Casual Game, das es einfach und unterhaltsam macht, mehr über unsere Welt zu lernen. Die fesselnde Spielmechanik verwandelt beiläufiges Spielen in sinnvolle Bildschirmzeit.`,
                image: play,
            },
            {
                title: "LERNEN",
                text: `Das Spiel passt sich deinem Wissensstand an und hilft dir, aus Fehlern zu lernen. Komplexe Themen wie die 50 US-Bundesstaaten werden durch kurze Spielsessions handhabbar. Fragen werden gezielt wiederholt, mit Fokus auf das, was du noch beherrschen musst.`,
                image: learn,
            },
            {
                title: "ERINNERN",
                text: `Erinnerungsmedaillen belohnen langfristiges Behalten, indem sie dich in optimalen Abständen herausfordern. Mit jeder erfolgreichen Wiederholung wächst der Abstand zwischen den Wiederholungen. So bleibt Wissen dauerhaft – mit minimalem Aufwand.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Mnemotechniken",
    featureCardsSmall2: [
        {
            title: "Loci-Methode",
            text: `Verwandle den Globus in deinen Gedächtnispalast. Jeder Ort wird zu einem starken Anker für Wissen und macht aus Geografie eine natürliche Gedächtniskarte.`,
            image: methodOfLoci,
        },
        {
            title: "Kontextuelles Gedächtnis",
            text: `Je mehr Verbindungen neues Wissen zu bestehenden Erinnerungen hat, desto leichter lässt sich ein bleibender Eindruck erzeugen.`,
            image: contextualMemory,
        },
        {
            title: "Verteiltes Lernen",
            text: `Wiederhole Wissen in zunehmenden Abständen, um mit minimalem Aufwand bleibende Erinnerungen aufzubauen.`,
            image: spacedRepetition,
        },
        {
            title: "Duale Kodierung",
            text: `Du lernst besser, wenn Wissen gleichzeitig in mehreren Formaten präsentiert wird (z. B. Bild, Text und Karte).`,
            image: dualCoding,
        },
        {
            title: "Verschachteltes Lernen",
            text: `Wir behalten Dinge besser, wenn wir gezwungen sind, neues Wissen in unterschiedlichen Kontexten anzuwenden.`,
            image: interleaving,
        },
        {
            title: "Casual Gaming",
            text: `Belohnungen, Animationen und Spieldesign machen Lernen zum Suchtfaktor.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Nutzerstimmen",
    testimonialsDescription: "Was unsere Nutzer über JordGlobe sagen",

    featureVideo: {
        title: "Gameplay-Video",
        playButtonAriaLabel: "Video abspielen",
        imageAlt: "Trailer",
    },
};

export default siteData;
