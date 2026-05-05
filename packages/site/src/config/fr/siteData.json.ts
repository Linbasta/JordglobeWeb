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
    title: "JordGlobe – le jeu de géographie ultime",
    description: "JordGlobe utilise des mécaniques de jeu addictives pour rendre l'apprentissage de la géographie amusant et facile.",

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
        alt: "JordGlobe – le jeu de géographie ultime",
    },

    heroDownload: {
        title: "Jouer à Jordglobe",
        description: "Téléchargez Jordglobe ici et commencez votre voyage !",
        appStoreAlt: "Télécharger sur l'App Store",
        googlePlayAlt: "Disponible sur Google Play",
    },

    heroSide: {
        title: "Rejoignez d'autres apprenants à vie",
        description: "Échangez des techniques de mémorisation éprouvées, partagez vos idées et accédez en avant-première à de nouvelles versions et fonctionnalités exclusives, comme la création de vos propres quiz.",
        communityCtaText: "Rejoindre notre communauté",
        imageAlt: "logiciel hero",
    },

    featureBento: {
        badgeText: "Apprendre en s'amusant",
        sectionTitle: "Le Duolingo de la géographie",
        card1Title: "Pays & drapeaux",
        card1Description: "Maîtrisez les pays et leurs drapeaux – des connaissances essentielles pour mieux comprendre l'actualité mondiale, les événements internationaux et la carte du monde en évolution. Ne vous sentez plus jamais perdu face aux nouvelles internationales.",
        card1ImageAlt: "pays et drapeaux",
        card1ImageAltLight: "pays et drapeaux clair",
        card2Title: "Régions & villes",
        card2Description: "Apprenez à connaître les villes et les régions pour comprendre où se déroulent les événements et pourquoi ils comptent. Des centres économiques aux foyers géopolitiques, savoir situer aide à saisir les relations internationales et l'actualité mondiale.",
        card2ImageAlt: "régions et villes",
        card3Title: "Anecdotes au-delà des frontières",
        card3Description: "Mettez-vous au défi avec des anecdotes amusantes qui dépassent la simple géographie. Découvrez des faits surprenants qui révèlent les liens cachés entre les peuples et les lieux – chaque coin du monde est connecté.",
        card3ImageAlt: "anecdotes au-delà de la géographie",
        ctaSrText: "Lancez votre voyage planétaire",
        learnMoreText: "Commencer à explorer",
        paymentInfoText: "Devenez maître du savoir",
    },

    featureThreeImage: {
        title: "Jouer --> Apprendre --> Retenir",
        cards: [
            {
                title: "JOUER",
                text: `JordGlobe est un jeu casual qui rend l'apprentissage du monde amusant et naturel. Ses mécaniques de jeu addictives transforment le temps d'écran en moments utiles.`,
                image: play,
            },
            {
                title: "APPRENDRE",
                text: `Le jeu s'adapte à votre niveau et vous aide à apprendre de vos erreurs. Des sujets complexes comme les 50 États américains deviennent abordables grâce à des sessions courtes. Les questions sont répétées de manière stratégique, en se concentrant sur ce que vous devez maîtriser.`,
                image: learn,
            },
            {
                title: "RETENIR",
                text: `Les Médailles de mémoire récompensent la mémorisation à long terme en vous mettant au défi à des intervalles optimaux. À chaque réussite, l'écart entre les répétitions augmente. Ancrez vos connaissances durablement avec un effort minimal.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Techniques de mémorisation",
    featureCardsSmall2: [
        {
            title: "Méthode des lieux",
            text: `Transformez le globe en votre palais mental. Chaque lieu devient un puissant ancrage de connaissance et fait de la géographie une carte mémorielle naturelle.`,
            image: methodOfLoci,
        },
        {
            title: "Mémoire contextuelle",
            text: `Plus une nouvelle connaissance est reliée à des souvenirs existants, plus il est facile d'en faire un souvenir durable.`,
            image: contextualMemory,
        },
        {
            title: "Répétition espacée",
            text: `Répétez les connaissances à intervalles croissants pour bâtir des souvenirs durables avec un effort minimal.`,
            image: spacedRepetition,
        },
        {
            title: "Double codage",
            text: `Vous apprenez mieux quand le savoir est présenté sous plusieurs formats à la fois (image, texte et carte, par exemple).`,
            image: dualCoding,
        },
        {
            title: "Apprentissage entrelacé",
            text: `On retient mieux quand on est obligé d'appliquer ses connaissances dans des contextes variés.`,
            image: interleaving,
        },
        {
            title: "Casual gaming",
            text: `Récompenses, animations et game design rendent l'apprentissage addictif.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Avis des utilisateurs",
    testimonialsDescription: "Ce que nos utilisateurs disent de JordGlobe",

    featureVideo: {
        title: "Vidéo de gameplay",
        playButtonAriaLabel: "lire la vidéo",
        imageAlt: "bande-annonce",
    },
};

export default siteData;
