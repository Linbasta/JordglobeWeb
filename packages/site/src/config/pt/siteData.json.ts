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
    title: "JordGlobe – o jogo de geografia definitivo",
    description: "O JordGlobe usa mecânicas de jogo envolventes para tornar o aprendizado de geografia divertido e fácil.",

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
        alt: "JordGlobe – o jogo de geografia definitivo",
    },

    heroDownload: {
        title: "Jogue Jordglobe",
        description: "Baixe o Jordglobe e comece sua aventura!",
        appStoreAlt: "Baixar na App Store",
        googlePlayAlt: "Disponível no Google Play",
    },

    heroSide: {
        title: "Junte-se a outros entusiastas do aprendizado",
        description: "Compartilhe técnicas comprovadas de memorização, troque ideias e tenha acesso antecipado a novas versões e recursos exclusivos, como criar seus próprios quizzes.",
        communityCtaText: "Junte-se à nossa comunidade",
        imageAlt: "hero do programa",
    },

    featureBento: {
        badgeText: "Aprenda jogando",
        sectionTitle: "O Duolingo da geografia",
        card1Title: "Países e bandeiras",
        card1Description: "Domine os países e suas bandeiras: o conhecimento básico que ajuda você a entender melhor as notícias do mundo, os acontecimentos internacionais e o mapa em constante mudança. Nunca mais se perca nas manchetes.",
        card1ImageAlt: "países e bandeiras",
        card1ImageAltLight: "países e bandeiras claras",
        card2Title: "Regiões e cidades",
        card2Description: "Aprenda sobre cidades e regiões para entender onde as coisas acontecem e por que importam. De polos econômicos a pontos geopolíticos quentes: conhecer os lugares ajuda você a captar as relações internacionais.",
        card2ImageAlt: "regiões e cidades",
        card3Title: "Curiosidades sem fronteiras",
        card3Description: "Teste seu conhecimento com curiosidades divertidas que vão além da geografia. Descubra fatos surpreendentes que revelam conexões ocultas entre pessoas e lugares: cada canto do mundo está conectado.",
        card3ImageAlt: "curiosidades além da geografia",
        ctaSrText: "Comece sua jornada global",
        learnMoreText: "Comece a explorar",
        paymentInfoText: "Torne-se um mestre do conhecimento",
    },

    featureThreeImage: {
        title: "Jogue --> Aprenda --> Lembre",
        cards: [
            {
                title: "JOGUE",
                text: `O JordGlobe é um jogo casual que torna aprender sobre o mundo divertido e natural. As mecânicas envolventes transformam o tempo de tela em momentos valiosos.`,
                image: play,
            },
            {
                title: "APRENDA",
                text: `O jogo se adapta ao seu nível e ajuda você a aprender com seus erros. Tópicos complexos como os 50 estados dos EUA ficam acessíveis graças a sessões curtas. As perguntas se repetem estrategicamente, focando no que você precisa dominar.`,
                image: learn,
            },
            {
                title: "LEMBRE",
                text: `As Medalhas de Memória recompensam a retenção de longo prazo testando você em intervalos ideais. A cada acerto, os intervalos entre repetições aumentam. Consolide o conhecimento por anos com esforço mínimo.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Técnicas de memorização",
    featureCardsSmall2: [
        {
            title: "Método de loci",
            text: `Transforme o globo no seu palácio da memória. Cada lugar se torna uma poderosa âncora de conhecimento e faz a geografia se transformar em um mapa natural da memória.`,
            image: methodOfLoci,
        },
        {
            title: "Memória contextual",
            text: `Quanto mais o conhecimento novo se conecta às memórias existentes, mais fácil é transformá-lo em uma lembrança duradoura.`,
            image: contextualMemory,
        },
        {
            title: "Repetição espaçada",
            text: `Revise o conhecimento em intervalos cada vez maiores para construir lembranças duradouras com o mínimo esforço.`,
            image: spacedRepetition,
        },
        {
            title: "Codificação dual",
            text: `Você aprende melhor quando o conhecimento é apresentado em vários formatos ao mesmo tempo (por exemplo, imagem, texto e mapa).`,
            image: dualCoding,
        },
        {
            title: "Aprendizado intercalado",
            text: `Você lembra melhor quando precisa aplicar o conhecimento em contextos diferentes.`,
            image: interleaving,
        },
        {
            title: "Jogo casual",
            text: `As recompensas, as animações e o design do jogo tornam o aprendizado viciante.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Opiniões dos usuários",
    testimonialsDescription: "Veja o que os usuários dizem sobre o JordGlobe",

    featureVideo: {
        title: "Vídeo de gameplay",
        playButtonAriaLabel: "reproduzir vídeo",
        imageAlt: "trailer",
    },
};

export default siteData;
