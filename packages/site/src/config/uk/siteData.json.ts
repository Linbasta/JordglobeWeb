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
    title: "JordGlobe – найкраща географічна гра",
    description: "JordGlobe використовує захопливу ігрову механіку, щоб зробити вивчення географії веселим і простим.",

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
        alt: "JordGlobe – найкраща географічна гра",
    },

    heroDownload: {
        title: "Грай у Jordglobe",
        description: "Завантажте Jordglobe і вирушайте в подорож!",
        appStoreAlt: "Завантажити в App Store",
        googlePlayAlt: "Доступно в Google Play",
    },

    heroSide: {
        title: "Приєднуйтеся до спільноти захоплених учнів",
        description: "Обмінюйтеся перевіреними техніками запам'ятовування, діліться ідеями та отримуйте ранній доступ до нових версій і ексклюзивних можливостей, як-от створення власних вікторин.",
        communityCtaText: "Приєднуйтеся до спільноти",
        imageAlt: "герой програми",
    },

    featureBento: {
        badgeText: "Вчіться граючи",
        sectionTitle: "Duolingo для географії",
        card1Title: "Країни та прапори",
        card1Description: "Опануйте країни та прапори — базові знання, які допоможуть краще розуміти новини, міжнародні події та мінливу карту світу. Більше ніколи не губіться в новинах.",
        card1ImageAlt: "країни та прапори",
        card1ImageAltLight: "країни та прапори світла версія",
        card2Title: "Регіони та міста",
        card2Description: "Вивчайте міста й регіони, щоб розуміти, де відбуваються події і чому це важливо. Від економічних центрів до геополітичних гарячих точок — знання місць допомагає розібратися в міжнародних відносинах.",
        card2ImageAlt: "регіони та міста",
        card3Title: "Вікторина за межами географії",
        card3Description: "Випробуйте себе цікавими питаннями, що виходять за межі географії. Відкривайте дивовижні факти, які розкривають приховані зв'язки між людьми та місцями — кожен куточок планети взаємопов'язаний.",
        card3ImageAlt: "вікторина за межами географії",
        ctaSrText: "Розпочни свою світову подорож",
        learnMoreText: "Почати дослідження",
        paymentInfoText: "Стань майстром знань",
    },

    featureThreeImage: {
        title: "Грай --> Вчись --> Запам'ятовуй",
        cards: [
            {
                title: "ГРАЙ",
                text: `JordGlobe — це казуальна гра, яка робить вивчення світу веселим і природним. Захоплива ігрова механіка перетворює час перед екраном на цінні моменти.`,
                image: play,
            },
            {
                title: "ВЧИСЬ",
                text: `Гра адаптується до вашого рівня й допомагає вчитися на помилках. Складні теми, як-от 50 штатів США, стають посильними в коротких сесіях. Питання стратегічно повторюються та зосереджуються на тому, що саме потрібно опанувати.`,
                image: learn,
            },
            {
                title: "ЗАПАМ'ЯТОВУЙ",
                text: `Медалі пам'яті винагороджують довготривалу пам'ять, перевіряючи вас з оптимальними інтервалами. З кожним успіхом інтервал між повтореннями зростає. Закріплюйте знання на роки з мінімальними зусиллями.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Техніки запам'ятовування",
    featureCardsSmall2: [
        {
            title: "Метод локусів",
            text: `Перетворіть земну кулю на власний палац пам'яті. Кожне місце стає потужним якорем для знань, а географія — природною картою пам'яті.`,
            image: methodOfLoci,
        },
        {
            title: "Контекстна пам'ять",
            text: `Чим більше нові знання пов'язані з наявними спогадами, тим легше вони перетворюються на стійку пам'ять.`,
            image: contextualMemory,
        },
        {
            title: "Інтервальне повторення",
            text: `Повторюйте знання з дедалі довшими інтервалами та формуйте стійку пам'ять з мінімальними зусиллями.`,
            image: spacedRepetition,
        },
        {
            title: "Подвійне кодування",
            text: `Ви вчитеся краще, коли знання подаються одночасно в кількох формах (наприклад, образ, текст і карта).`,
            image: dualCoding,
        },
        {
            title: "Чергування",
            text: `Ви запам'ятовуєте краще, коли застосовуєте знання в різних контекстах.`,
            image: interleaving,
        },
        {
            title: "Казуальні ігри",
            text: `Винагороди, анімації та ігровий дизайн роблять навчання захопливим.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Відгуки користувачів",
    testimonialsDescription: "Що користувачі говорять про JordGlobe",

    featureVideo: {
        title: "Ігрове відео",
        playButtonAriaLabel: "відтворити відео",
        imageAlt: "трейлер",
    },
};

export default siteData;
