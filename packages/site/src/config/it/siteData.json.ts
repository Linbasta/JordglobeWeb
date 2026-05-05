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
    title: "JordGlobe – il gioco di geografia definitivo",
    description: "JordGlobe usa meccaniche di gioco coinvolgenti per rendere l'apprendimento della geografia divertente e naturale.",

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
        alt: "JordGlobe – il gioco di geografia definitivo",
    },

    heroDownload: {
        title: "Gioca a JordGlobe",
        description: "Scarica JordGlobe qui e inizia il tuo viaggio!",
        appStoreAlt: "Scarica dall'App Store",
        googlePlayAlt: "Disponibile su Google Play",
    },

    heroSide: {
        title: "Incontra altri appassionati di apprendimento",
        description: "Condividi tecniche di memorizzazione collaudate, le tue idee e ottieni accesso anticipato a nuove versioni e funzionalità esclusive come quiz personalizzati.",
        communityCtaText: "Unisciti alla nostra community",
        imageAlt: "Hero software",
    },

    featureBento: {
        badgeText: "Imparare divertendosi",
        sectionTitle: "Il Duolingo della geografia",
        card1Title: "Paesi e bandiere",
        card1Description: "Padroneggia paesi e bandiere – conoscenze fondamentali che ti aiutano a comprendere le notizie mondiali, gli eventi internazionali e la mappa del mondo in continuo cambiamento. Non sentirti mai più perso davanti alle notizie.",
        card1ImageAlt: "Paesi e bandiere",
        card1ImageAltLight: "Paesi e bandiere chiaro",
        card2Title: "Province e città",
        card2Description: "Scopri città e regioni per capire dove avvengono gli eventi e perché sono importanti. Dalle metropoli economiche ai punti caldi geopolitici – conoscere i luoghi ti aiuta a comprendere le relazioni internazionali e gli sviluppi globali.",
        card2ImageAlt: "Province e città",
        card3Title: "Curiosità oltre i confini",
        card3Description: "Mettiti alla prova con domande divertenti che vanno oltre la pura geografia. Scopri fatti sorprendenti che rivelano connessioni nascoste tra persone e luoghi – ogni angolo del mondo è collegato.",
        card3ImageAlt: "Curiosità oltre la geografia",
        ctaSrText: "Inizia il tuo viaggio globale",
        learnMoreText: "Scopri ora",
        paymentInfoText: "Diventa un maestro del sapere",
    },

    featureThreeImage: {
        title: "Gioca --> Impara --> Ricorda",
        cards: [
            {
                title: "GIOCA",
                text: `JordGlobe è un casual game che rende semplice e divertente imparare di più sul nostro mondo. Le meccaniche di gioco coinvolgenti trasformano il tempo davanti allo schermo in apprendimento significativo.`,
                image: play,
            },
            {
                title: "IMPARA",
                text: `Il gioco si adatta al tuo livello di conoscenza e ti aiuta a imparare dagli errori. Argomenti complessi come i 50 stati USA diventano gestibili attraverso brevi sessioni di gioco. Le domande vengono ripetute in modo mirato, concentrandosi su ciò che devi ancora padroneggiare.`,
                image: learn,
            },
            {
                title: "RICORDA",
                text: `Le medaglie della memoria premiano la ritenzione a lungo termine sfidandoti a intervalli ottimali. Con ogni ripetizione riuscita, l'intervallo tra le revisioni aumenta. Così la conoscenza resta – con il minimo sforzo.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Tecniche di memorizzazione",
    featureCardsSmall2: [
        {
            title: "Metodo dei loci",
            text: `Trasforma il globo nel tuo palazzo della memoria. Ogni luogo diventa un'ancora potente per la conoscenza, rendendo la geografia una mappa mentale naturale.`,
            image: methodOfLoci,
        },
        {
            title: "Memoria contestuale",
            text: `Più connessioni ha una nuova conoscenza con ricordi esistenti, più è facile creare un'impressione duratura.`,
            image: contextualMemory,
        },
        {
            title: "Ripetizione dilazionata",
            text: `Ripeti le conoscenze a intervalli crescenti per costruire ricordi duraturi con il minimo sforzo.`,
            image: spacedRepetition,
        },
        {
            title: "Doppia codifica",
            text: `Si impara meglio quando la conoscenza viene presentata contemporaneamente in più formati (ad es. immagine, testo e mappa).`,
            image: dualCoding,
        },
        {
            title: "Apprendimento interlacciato",
            text: `Ricordiamo meglio quando siamo costretti ad applicare nuove conoscenze in contesti diversi.`,
            image: interleaving,
        },
        {
            title: "Casual gaming",
            text: `Ricompense, animazioni e design di gioco rendono l'apprendimento avvincente.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Opinioni degli utenti",
    testimonialsDescription: "Cosa dicono i nostri utenti di JordGlobe",

    featureVideo: {
        title: "Video di gameplay",
        playButtonAriaLabel: "Riproduci video",
        imageAlt: "Trailer",
    },
};

export default siteData;
