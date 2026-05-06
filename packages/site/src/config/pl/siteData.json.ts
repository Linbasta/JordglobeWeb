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
    title: "JordGlobe – ostateczna gra geograficzna",
    description: "JordGlobe wykorzystuje wciągające mechaniki gier, by nauka geografii była zabawna i prosta.",

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
        alt: "JordGlobe – ostateczna gra geograficzna",
    },

    heroDownload: {
        title: "Zagraj w Jordglobe",
        description: "Pobierz Jordglobe i rozpocznij swoją podróż!",
        appStoreAlt: "Pobierz w App Store",
        googlePlayAlt: "Dostępne w Google Play",
    },

    heroSide: {
        title: "Dołącz do innych pasjonatów nauki",
        description: "Wymieniaj się sprawdzonymi technikami zapamiętywania, dziel się pomysłami i uzyskaj wcześniejszy dostęp do nowych wersji oraz ekskluzywnych funkcji, takich jak tworzenie własnych quizów.",
        communityCtaText: "Dołącz do naszej społeczności",
        imageAlt: "hero programu",
    },

    featureBento: {
        badgeText: "Naucz się, bawiąc się",
        sectionTitle: "Duolingo geografii",
        card1Title: "Państwa i flagi",
        card1Description: "Opanuj państwa i ich flagi – podstawową wiedzę, która pomaga lepiej rozumieć światowe wiadomości, wydarzenia międzynarodowe i zmieniającą się mapę świata. Nigdy więcej nie zgub się w newsach.",
        card1ImageAlt: "państwa i flagi",
        card1ImageAltLight: "państwa i flagi jasne",
        card2Title: "Regiony i miasta",
        card2Description: "Poznaj miasta i regiony, by zrozumieć, gdzie dzieją się wydarzenia i dlaczego mają znaczenie. Od centrów gospodarczych po zapalne punkty geopolityczne – znajomość miejsc pomaga uchwycić relacje międzynarodowe.",
        card2ImageAlt: "regiony i miasta",
        card3Title: "Ciekawostki ponad granicami",
        card3Description: "Zmierz się z zabawnymi ciekawostkami, które wykraczają poza samą geografię. Odkrywaj zaskakujące fakty ujawniające ukryte powiązania między ludźmi i miejscami – każdy zakątek świata jest połączony.",
        card3ImageAlt: "ciekawostki poza geografią",
        ctaSrText: "Rozpocznij swoją globalną podróż",
        learnMoreText: "Zacznij odkrywać",
        paymentInfoText: "Zostań mistrzem wiedzy",
    },

    featureThreeImage: {
        title: "Graj --> Ucz się --> Zapamiętaj",
        cards: [
            {
                title: "GRAJ",
                text: `JordGlobe to gra casualowa, dzięki której nauka o świecie staje się zabawna i naturalna. Wciągające mechaniki zamieniają czas przed ekranem w wartościowe chwile.`,
                image: play,
            },
            {
                title: "UCZ SIĘ",
                text: `Gra dostosowuje się do twojego poziomu i pomaga uczyć się na błędach. Złożone tematy, takie jak 50 stanów USA, stają się przystępne dzięki krótkim sesjom. Pytania powtarzają się strategicznie, koncentrując się na tym, co musisz opanować.`,
                image: learn,
            },
            {
                title: "ZAPAMIĘTAJ",
                text: `Medale Pamięci nagradzają długotrwałe zapamiętywanie, sprawdzając cię w optymalnych odstępach czasu. Z każdym sukcesem przerwy między powtórkami się wydłużają. Utrwal wiedzę na lata przy minimalnym wysiłku.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Techniki zapamiętywania",
    featureCardsSmall2: [
        {
            title: "Metoda miejsc",
            text: `Zamień globus w swój pałac pamięci. Każde miejsce staje się potężną kotwicą wiedzy i sprawia, że geografia staje się naturalną mapą pamięci.`,
            image: methodOfLoci,
        },
        {
            title: "Pamięć kontekstowa",
            text: `Im bardziej nowa wiedza jest powiązana z istniejącymi wspomnieniami, tym łatwiej zamienić ją w trwałe wspomnienie.`,
            image: contextualMemory,
        },
        {
            title: "Powtórki rozłożone w czasie",
            text: `Powtarzaj wiedzę w coraz dłuższych odstępach, by budować trwałe wspomnienia minimalnym wysiłkiem.`,
            image: spacedRepetition,
        },
        {
            title: "Podwójne kodowanie",
            text: `Uczysz się lepiej, gdy wiedza jest prezentowana w wielu formatach jednocześnie (np. obraz, tekst i mapa).`,
            image: dualCoding,
        },
        {
            title: "Nauka przeplatana",
            text: `Lepiej zapamiętujesz, gdy musisz stosować wiedzę w różnych kontekstach.`,
            image: interleaving,
        },
        {
            title: "Casualowa rozgrywka",
            text: `Nagrody, animacje i game design sprawiają, że nauka staje się wciągająca.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Opinie użytkowników",
    testimonialsDescription: "Co użytkownicy mówią o JordGlobe",

    featureVideo: {
        title: "Film z rozgrywki",
        playButtonAriaLabel: "odtwórz film",
        imageAlt: "zwiastun",
    },
};

export default siteData;
