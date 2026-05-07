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
    title: "JordGlobe – paras maantieteenpeli",
    description: "JordGlobe käyttää koukuttavaa pelimekaniikkaa tehdäkseen maantieteen oppimisesta hauskaa ja helppoa.",

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
        alt: "JordGlobe – paras maantieteenpeli",
    },

    heroDownload: {
        title: "Pelaa Jordglobea",
        description: "Lataa Jordglobe ja aloita matkasi!",
        appStoreAlt: "Lataa App Storesta",
        googlePlayAlt: "Saatavilla Google Playsta",
    },

    heroSide: {
        title: "Liity innokkaiden oppijoiden yhteisöön",
        description: "Vaihda hyväksi havaittuja muistitekniikoita, jaa ideoita ja saa varhainen pääsy uusiin versioihin ja eksklusiivisiin ominaisuuksiin, kuten mahdollisuuteen luoda omia tietovisoja.",
        communityCtaText: "Liity yhteisöömme",
        imageAlt: "ohjelman hero",
    },

    featureBento: {
        badgeText: "Opi leikkien",
        sectionTitle: "Maantieteen Duolingo",
        card1Title: "Maat ja liput",
        card1Description: "Hallitse maat ja liput — perustieto, joka auttaa sinua ymmärtämään uutisia, kansainvälisiä tapahtumia ja muuttuvaa maailmankarttaa paremmin. Et eksy enää uutisten lomaan.",
        card1ImageAlt: "maat ja liput",
        card1ImageAltLight: "maat ja liput vaalea",
        card2Title: "Alueet ja kaupungit",
        card2Description: "Tutustu kaupunkeihin ja alueisiin, niin ymmärrät missä asiat tapahtuvat ja miksi sillä on merkitystä. Talouskeskuksista geopoliittisiin kuumiin pisteisiin — paikkojen tunteminen auttaa hahmottamaan kansainvälisiä suhteita.",
        card2ImageAlt: "alueet ja kaupungit",
        card3Title: "Tietovisa rajojen yli",
        card3Description: "Haasta itsesi hauskoilla kysymyksillä, jotka ulottuvat pelkkää maantiedettä pidemmälle. Löydä yllättäviä tosiasioita, jotka paljastavat ihmisten ja paikkojen piilotetut yhteydet — jokainen maapallon kolkka on yhteydessä toisiinsa.",
        card3ImageAlt: "maantiedettä laajempi visailu",
        ctaSrText: "Aloita maailmanmatkasi",
        learnMoreText: "Aloita tutkiminen",
        paymentInfoText: "Tule tietomestariksi",
    },

    featureThreeImage: {
        title: "Pelaa --> Opi --> Muista",
        cards: [
            {
                title: "PELAA",
                text: `JordGlobe on rento peli, joka tekee maailman oppimisesta hauskaa ja luonnollista. Mukaansatempaava pelimekaniikka muuttaa ruutuajan arvokkaiksi hetkiksi.`,
                image: play,
            },
            {
                title: "OPI",
                text: `Peli mukautuu tasoosi ja auttaa oppimaan virheistäsi. Monimutkaiset aiheet, kuten USA:n 50 osavaltiota, muuttuvat hallittaviksi lyhyissä pelisessioissa. Kysymykset toistuvat strategisesti ja keskittyvät siihen, mitä sinun täytyy hallita.`,
                image: learn,
            },
            {
                title: "MUISTA",
                text: `Muistimitaalit palkitsevat pitkäkestoisen muistin testaamalla sinua optimaalisin välein. Jokaisen onnistumisen jälkeen toistojen väli pitenee. Kiinnitä tieto vuosiksi minimaalisella vaivalla.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Muistitekniikat",
    featureCardsSmall2: [
        {
            title: "Loci-menetelmä",
            text: `Tee maapallosta oma muistipalatsisi. Jokaisesta paikasta tulee tehokas ankkuri tiedolle, ja maantiede muuttuu luonnolliseksi muistikartaksi.`,
            image: methodOfLoci,
        },
        {
            title: "Kontekstuaalinen muisti",
            text: `Mitä paremmin uusi tieto liittyy olemassa oleviin muistoihin, sitä helpompi siitä on tehdä pysyvä muisto.`,
            image: contextualMemory,
        },
        {
            title: "Jaksottainen kertaus",
            text: `Kertaa tieto yhä pidemmin välein ja rakenna pysyviä muistoja minimaalisella vaivalla.`,
            image: spacedRepetition,
        },
        {
            title: "Kaksoiskoodaus",
            text: `Opit paremmin, kun tieto esitetään useassa muodossa samanaikaisesti (esim. kuva, teksti ja kartta).`,
            image: dualCoding,
        },
        {
            title: "Vuorotteleva oppiminen",
            text: `Muistat paremmin, kun joudut soveltamaan tietoa erilaisissa tilanteissa.`,
            image: interleaving,
        },
        {
            title: "Casual-pelaaminen",
            text: `Palkinnot, animaatiot ja pelisuunnittelu tekevät oppimisesta koukuttavaa.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Käyttäjien palaute",
    testimonialsDescription: "Mitä käyttäjät sanovat JordGlobesta",

    featureVideo: {
        title: "Pelivideo",
        playButtonAriaLabel: "toista video",
        imageAlt: "traileri",
    },
};

export default siteData;
