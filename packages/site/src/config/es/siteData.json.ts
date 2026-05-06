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
    title: "JordGlobe – el juego de geografía definitivo",
    description: "JordGlobe utiliza mecánicas de juego envolventes para que aprender geografía sea divertido y sencillo.",

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
        alt: "JordGlobe – el juego de geografía definitivo",
    },

    heroDownload: {
        title: "Juega a Jordglobe",
        description: "¡Descarga Jordglobe y comienza tu aventura!",
        appStoreAlt: "Descargar en App Store",
        googlePlayAlt: "Disponible en Google Play",
    },

    heroSide: {
        title: "Únete a otros entusiastas del aprendizaje",
        description: "Comparte técnicas de memorización probadas, intercambia ideas y obtén acceso anticipado a nuevas versiones y funciones exclusivas, como crear tus propios cuestionarios.",
        communityCtaText: "Únete a nuestra comunidad",
        imageAlt: "hero del programa",
    },

    featureBento: {
        badgeText: "Aprende jugando",
        sectionTitle: "El Duolingo de la geografía",
        card1Title: "Países y banderas",
        card1Description: "Domina los países y sus banderas: el conocimiento básico que te ayuda a entender mejor las noticias mundiales, los acontecimientos internacionales y el cambiante mapa del mundo. Nunca más te perderás en las noticias.",
        card1ImageAlt: "países y banderas",
        card1ImageAltLight: "países y banderas claras",
        card2Title: "Regiones y ciudades",
        card2Description: "Aprende sobre ciudades y regiones para entender dónde ocurren las cosas y por qué importan. Desde centros económicos hasta puntos geopolíticos calientes: conocer los lugares te ayuda a captar las relaciones internacionales.",
        card2ImageAlt: "regiones y ciudades",
        card3Title: "Curiosidades sin fronteras",
        card3Description: "Pon a prueba tus conocimientos con curiosidades divertidas que van más allá de la geografía. Descubre datos sorprendentes que revelan conexiones ocultas entre personas y lugares: cada rincón del mundo está conectado.",
        card3ImageAlt: "curiosidades más allá de la geografía",
        ctaSrText: "Comienza tu viaje global",
        learnMoreText: "Empieza a explorar",
        paymentInfoText: "Conviértete en un maestro del conocimiento",
    },

    featureThreeImage: {
        title: "Juega --> Aprende --> Recuerda",
        cards: [
            {
                title: "JUEGA",
                text: `JordGlobe es un juego casual que hace que aprender sobre el mundo sea divertido y natural. Las mecánicas envolventes convierten el tiempo en pantalla en momentos valiosos.`,
                image: play,
            },
            {
                title: "APRENDE",
                text: `El juego se adapta a tu nivel y te ayuda a aprender de tus errores. Temas complejos como los 50 estados de EE. UU. se vuelven accesibles gracias a sesiones cortas. Las preguntas se repiten estratégicamente, centrándose en lo que necesitas dominar.`,
                image: learn,
            },
            {
                title: "RECUERDA",
                text: `Las Medallas de Memoria recompensan la retención a largo plazo poniéndote a prueba en intervalos óptimos. Con cada éxito, los intervalos entre repeticiones se alargan. Consolida el conocimiento durante años con un esfuerzo mínimo.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Técnicas de memorización",
    featureCardsSmall2: [
        {
            title: "Método de loci",
            text: `Convierte el globo en tu palacio de la memoria. Cada lugar se convierte en un poderoso ancla de conocimiento y hace que la geografía se transforme en un mapa natural de la memoria.`,
            image: methodOfLoci,
        },
        {
            title: "Memoria contextual",
            text: `Cuanto más se conecte el conocimiento nuevo con los recuerdos existentes, más fácil será convertirlo en un recuerdo duradero.`,
            image: contextualMemory,
        },
        {
            title: "Repetición espaciada",
            text: `Repasa el conocimiento en intervalos cada vez más largos para construir recuerdos duraderos con el mínimo esfuerzo.`,
            image: spacedRepetition,
        },
        {
            title: "Codificación dual",
            text: `Aprendes mejor cuando el conocimiento se presenta en varios formatos a la vez (por ejemplo, imagen, texto y mapa).`,
            image: dualCoding,
        },
        {
            title: "Aprendizaje intercalado",
            text: `Recuerdas mejor cuando tienes que aplicar el conocimiento en distintos contextos.`,
            image: interleaving,
        },
        {
            title: "Juego casual",
            text: `Las recompensas, las animaciones y el diseño del juego hacen que aprender sea adictivo.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Opiniones de usuarios",
    testimonialsDescription: "Esto es lo que los usuarios dicen sobre JordGlobe",

    featureVideo: {
        title: "Vídeo de gameplay",
        playButtonAriaLabel: "reproducir vídeo",
        imageAlt: "tráiler",
    },
};

export default siteData;
