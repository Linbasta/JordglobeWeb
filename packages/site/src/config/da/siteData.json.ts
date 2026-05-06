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
    title: "JordGlobe – det ultimative geografispil",
    description: "JordGlobe bruger fængslende spilmekanik til at gøre det sjovt og nemt at lære geografi.",

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
        alt: "JordGlobe – det ultimative geografispil",
    },

    heroDownload: {
        title: "Spil Jordglobe",
        description: "Download Jordglobe og start din rejse!",
        appStoreAlt: "Hent i App Store",
        googlePlayAlt: "Hent på Google Play",
    },

    heroSide: {
        title: "Bliv en del af et fællesskab af engagerede lærende",
        description: "Udveksl dokumenterede memoreringsteknikker, del idéer og få tidlig adgang til nye versioner og eksklusive funktioner som muligheden for at oprette dine egne quizzer.",
        communityCtaText: "Deltag i vores fællesskab",
        imageAlt: "programmets hero",
    },

    featureBento: {
        badgeText: "Lær mens du leger",
        sectionTitle: "Geografiens Duolingo",
        card1Title: "Lande og flag",
        card1Description: "Få styr på lande og deres flag — den grundlæggende viden, der hjælper dig med bedre at forstå verdens nyheder, internationale begivenheder og det skiftende verdenskort. Far aldrig vild i nyhederne igen.",
        card1ImageAlt: "lande og flag",
        card1ImageAltLight: "lande og flag lys",
        card2Title: "Regioner og byer",
        card2Description: "Lær byer og regioner at kende, så du forstår, hvor begivenhederne sker, og hvorfor de betyder noget. Fra økonomiske knudepunkter til geopolitiske brændpunkter — kendskab til steder hjælper dig med at gennemskue internationale forhold.",
        card2ImageAlt: "regioner og byer",
        card3Title: "Trivia på tværs af grænser",
        card3Description: "Test dig selv i sjov trivia, der rækker længere end blot geografi. Opdag overraskende fakta, der afslører de skjulte forbindelser mellem mennesker og steder — hvert hjørne af kloden er forbundet.",
        card3ImageAlt: "trivia ud over geografi",
        ctaSrText: "Begynd din globale rejse",
        learnMoreText: "Begynd at udforske",
        paymentInfoText: "Bliv en mester i viden",
    },

    featureThreeImage: {
        title: "Spil --> Lær --> Husk",
        cards: [
            {
                title: "SPIL",
                text: `JordGlobe er et casual-spil, der gør det sjovt og naturligt at lære om verden. Engagerende spilmekanik forvandler skærmtid til værdifulde øjeblikke.`,
                image: play,
            },
            {
                title: "LÆR",
                text: `Spillet tilpasser sig dit niveau og hjælper dig med at lære af dine fejl. Komplekse emner som de 50 amerikanske stater bliver overskuelige i korte sessioner. Spørgsmålene gentages strategisk og fokuserer på det, du har brug for at mestre.`,
                image: learn,
            },
            {
                title: "HUSK",
                text: `Hukommelsesmedaljer belønner langtidshukommelse ved at teste dig med optimale intervaller. For hver succes bliver afstanden mellem gentagelserne længere. Forankr din viden i årevis med minimal indsats.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Memoreringsteknikker",
    featureCardsSmall2: [
        {
            title: "Loci-metoden",
            text: `Forvandl globussen til dit eget hukommelsespalads. Hvert sted bliver et stærkt holdepunkt for viden og gør geografien til et naturligt hukommelseskort.`,
            image: methodOfLoci,
        },
        {
            title: "Kontekstuel hukommelse",
            text: `Jo mere ny viden er forbundet med eksisterende minder, desto lettere er det at gøre den til en varig erindring.`,
            image: contextualMemory,
        },
        {
            title: "Fordelt repetition",
            text: `Genbesøg viden med stadig længere mellemrum og opbyg varige minder med minimal indsats.`,
            image: spacedRepetition,
        },
        {
            title: "Dobbeltkodning",
            text: `Du lærer bedre, når viden præsenteres i flere formater på samme tid (fx billede, tekst og kort).`,
            image: dualCoding,
        },
        {
            title: "Vekslende læring",
            text: `Du husker bedre, når du skal anvende viden i forskellige sammenhænge.`,
            image: interleaving,
        },
        {
            title: "Casual gameplay",
            text: `Belønninger, animationer og spildesign gør læring vanedannende.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Brugerudtalelser",
    testimonialsDescription: "Hvad brugerne siger om JordGlobe",

    featureVideo: {
        title: "Gameplay-video",
        playButtonAriaLabel: "afspil video",
        imageAlt: "trailer",
    },
};

export default siteData;
