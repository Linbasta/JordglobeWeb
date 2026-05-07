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
    title: "JordGlobe – nejlepší zeměpisná hra",
    description: "JordGlobe využívá návykové herní mechanismy, aby učení zeměpisu bylo zábavné a snadné.",

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
        alt: "JordGlobe – nejlepší zeměpisná hra",
    },

    heroDownload: {
        title: "Hraj Jordglobe",
        description: "Stáhni si Jordglobe a vydej se na cestu!",
        appStoreAlt: "Stáhnout v App Store",
        googlePlayAlt: "Dostupné na Google Play",
    },

    heroSide: {
        title: "Připoj se ke komunitě nadšených studentů",
        description: "Sdílejte ověřené techniky zapamatování, vyměňujte si nápady a získejte předčasný přístup k novým verzím a exkluzivním funkcím, jako je možnost vytvářet vlastní kvízy.",
        communityCtaText: "Připoj se k naší komunitě",
        imageAlt: "ukázka aplikace",
    },

    featureBento: {
        badgeText: "Učte se hraním",
        sectionTitle: "Duolingo pro zeměpis",
        card1Title: "Země a vlajky",
        card1Description: "Osvojte si státy a vlajky — základní znalost, která vám pomůže lépe rozumět zprávám, mezinárodnímu dění i měnící se mapě světa. Už se ve zprávách neztratíte.",
        card1ImageAlt: "země a vlajky",
        card1ImageAltLight: "země a vlajky světlá verze",
        card2Title: "Regiony a města",
        card2Description: "Učte se města a regiony, abyste rozuměli, kde se věci dějí a proč na tom záleží. Od ekonomických center po geopolitická ohniska — znalost míst pomáhá pochopit mezinárodní vztahy.",
        card2ImageAlt: "regiony a města",
        card3Title: "Kvíz nad rámec zeměpisu",
        card3Description: "Vyzkoušejte se v zábavných otázkách, které sahají dál než jen do zeměpisu. Objevujte překvapivé skutečnosti odhalující skryté souvislosti mezi lidmi a místy — každý kout planety je propojený.",
        card3ImageAlt: "kvíz nad rámec zeměpisu",
        ctaSrText: "Vydej se na cestu kolem světa",
        learnMoreText: "Začni objevovat",
        paymentInfoText: "Staň se mistrem znalostí",
    },

    featureThreeImage: {
        title: "Hraj --> Uč se --> Pamatuj",
        cards: [
            {
                title: "HRAJ",
                text: `JordGlobe je casual hra, díky které je poznávání světa zábavné a přirozené. Poutavá herní mechanika mění čas u obrazovky v hodnotné okamžiky.`,
                image: play,
            },
            {
                title: "UČ SE",
                text: `Hra se přizpůsobuje vaší úrovni a pomáhá vám učit se z chyb. Složitá témata, jako 50 amerických států, se v krátkých sezeních stávají zvládnutelnými. Otázky se strategicky opakují a zaměřují se na to, co potřebujete zvládnout.`,
                image: learn,
            },
            {
                title: "PAMATUJ",
                text: `Medaile paměti odměňují vaši dlouhodobou paměť tím, že vás zkoušejí v optimálních intervalech. S každým úspěchem se rozestup mezi opakováními prodlužuje. Ukotvěte si znalosti na roky s minimálním úsilím.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Techniky zapamatování",
    featureCardsSmall2: [
        {
            title: "Metoda míst",
            text: `Proměňte zeměkouli ve svůj vlastní palác paměti. Každé místo se stane silnou kotvou pro znalosti a zeměpis se promění v přirozenou paměťovou mapu.`,
            image: methodOfLoci,
        },
        {
            title: "Kontextová paměť",
            text: `Čím více jsou nové znalosti propojené s existujícími vzpomínkami, tím snáze se z nich stane trvalá paměť.`,
            image: contextualMemory,
        },
        {
            title: "Rozložené opakování",
            text: `Opakujte znalosti v postupně prodlužujících se intervalech a budujte trvalou paměť s minimálním úsilím.`,
            image: spacedRepetition,
        },
        {
            title: "Duální kódování",
            text: `Učíte se lépe, když jsou znalosti prezentovány v několika formách současně (např. obraz, text a mapa).`,
            image: dualCoding,
        },
        {
            title: "Prokládání",
            text: `Lépe si pamatujete, když znalosti aplikujete v různých kontextech.`,
            image: interleaving,
        },
        {
            title: "Casual gaming",
            text: `Odměny, animace a herní design dělají učení návykovým.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Reakce uživatelů",
    testimonialsDescription: "Co uživatelé říkají o JordGlobe",

    featureVideo: {
        title: "Herní video",
        playButtonAriaLabel: "přehrát video",
        imageAlt: "trailer",
    },
};

export default siteData;
