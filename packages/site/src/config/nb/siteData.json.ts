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
    title: "JordGlobe – det ultimate geografispillet",
    description: "JordGlobe bruker fengende spillmekanikk for å gjøre det gøy og enkelt å lære geografi.",

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
        alt: "JordGlobe – det ultimate geografispillet",
    },

    heroDownload: {
        title: "Spill Jordglobe",
        description: "Last ned Jordglobe og start reisen din!",
        appStoreAlt: "Last ned i App Store",
        googlePlayAlt: "Tilgjengelig på Google Play",
    },

    heroSide: {
        title: "Bli med i et fellesskap av engasjerte lærende",
        description: "Utveksle utprøvde memoreringsteknikker, del idéer og få tidlig tilgang til nye versjoner og eksklusive funksjoner som muligheten til å lage dine egne quizer.",
        communityCtaText: "Bli med i fellesskapet vårt",
        imageAlt: "programmets hero",
    },

    featureBento: {
        badgeText: "Lær mens du leker",
        sectionTitle: "Geografiens Duolingo",
        card1Title: "Land og flagg",
        card1Description: "Få oversikt over land og flagg — den grunnleggende kunnskapen som hjelper deg å forstå nyhetene, internasjonale hendelser og det skiftende verdenskartet bedre. Aldri mer gå deg vill i nyhetene.",
        card1ImageAlt: "land og flagg",
        card1ImageAltLight: "land og flagg lys",
        card2Title: "Regioner og byer",
        card2Description: "Bli kjent med byer og regioner, så du forstår hvor ting skjer og hvorfor det betyr noe. Fra økonomiske knutepunkter til geopolitiske brennpunkter — kjennskap til steder hjelper deg å gripe internasjonale forhold.",
        card2ImageAlt: "regioner og byer",
        card3Title: "Quiz på tvers av grenser",
        card3Description: "Utfordre deg selv med morsomme spørsmål som rekker lenger enn bare geografi. Oppdag overraskende fakta som avslører de skjulte koblingene mellom mennesker og steder — hvert hjørne av kloden er forbundet.",
        card3ImageAlt: "quiz utover geografi",
        ctaSrText: "Start din globale reise",
        learnMoreText: "Begynn å utforske",
        paymentInfoText: "Bli en kunnskapsmester",
    },

    featureThreeImage: {
        title: "Spill --> Lær --> Husk",
        cards: [
            {
                title: "SPILL",
                text: `JordGlobe er et casual-spill som gjør det gøy og naturlig å lære om verden. Engasjerende spillmekanikk gjør skjermtid om til verdifulle øyeblikk.`,
                image: play,
            },
            {
                title: "LÆR",
                text: `Spillet tilpasser seg ditt nivå og hjelper deg å lære av feilene dine. Komplekse temaer som de 50 amerikanske statene blir håndterbare i korte økter. Spørsmålene gjentas strategisk og fokuserer på det du trenger å beherske.`,
                image: learn,
            },
            {
                title: "HUSK",
                text: `Hukommelsesmedaljer belønner langtidshukommelse ved å teste deg med optimale intervaller. For hver suksess blir avstanden mellom repetisjonene lengre. Forankre kunnskapen i årevis med minimal innsats.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Memoreringsteknikker",
    featureCardsSmall2: [
        {
            title: "Loci-metoden",
            text: `Gjør globusen om til ditt eget hukommelsespalass. Hvert sted blir et kraftig holdepunkt for kunnskap og gjør geografi til et naturlig hukommelseskart.`,
            image: methodOfLoci,
        },
        {
            title: "Kontekstuell hukommelse",
            text: `Jo mer ny kunnskap er knyttet til eksisterende minner, desto lettere er det å gjøre den til et varig minne.`,
            image: contextualMemory,
        },
        {
            title: "Fordelt repetisjon",
            text: `Repetér kunnskapen med stadig lengre mellomrom og bygg varige minner med minimal innsats.`,
            image: spacedRepetition,
        },
        {
            title: "Dobbeltkoding",
            text: `Du lærer bedre når kunnskap presenteres i flere formater samtidig (f.eks. bilde, tekst og kart).`,
            image: dualCoding,
        },
        {
            title: "Vekslende læring",
            text: `Du husker bedre når du må bruke kunnskapen i ulike sammenhenger.`,
            image: interleaving,
        },
        {
            title: "Casual-spilling",
            text: `Belønninger, animasjoner og spilldesign gjør læringen vanedannende.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Tilbakemeldinger fra brukere",
    testimonialsDescription: "Hva brukerne sier om JordGlobe",

    featureVideo: {
        title: "Spillvideo",
        playButtonAriaLabel: "spill av video",
        imageAlt: "trailer",
    },
};

export default siteData;
