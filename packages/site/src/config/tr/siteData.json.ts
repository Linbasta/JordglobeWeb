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
    title: "JordGlobe – nihai coğrafya oyunu",
    description: "JordGlobe, coğrafya öğrenmeyi eğlenceli ve kolay hale getirmek için ilgi çekici oyun mekaniklerini kullanır.",

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
        alt: "JordGlobe – nihai coğrafya oyunu",
    },

    heroDownload: {
        title: "Jordglobe Oyna",
        description: "Jordglobe'u indir ve maceran başlasın!",
        appStoreAlt: "App Store'dan indir",
        googlePlayAlt: "Google Play'de mevcut",
    },

    heroSide: {
        title: "Diğer öğrenme tutkunlarına katıl",
        description: "Kanıtlanmış hafıza tekniklerini paylaş, fikir alışverişinde bulun ve yeni sürümlere ile kendi sınavlarını oluşturma gibi özel özelliklere erken erişim kazan.",
        communityCtaText: "Topluluğumuza katılın",
        imageAlt: "program kahramanı",
    },

    featureBento: {
        badgeText: "Oynayarak öğren",
        sectionTitle: "Coğrafyanın Duolingo'su",
        card1Title: "Ülkeler ve bayraklar",
        card1Description: "Ülkelere ve bayraklarına hâkim ol: dünya haberlerini, uluslararası olayları ve sürekli değişen haritayı daha iyi anlamana yardımcı olan temel bilgi. Manşetlerde bir daha asla kaybolma.",
        card1ImageAlt: "ülkeler ve bayraklar",
        card1ImageAltLight: "açık renkli ülkeler ve bayraklar",
        card2Title: "Bölgeler ve şehirler",
        card2Description: "Olayların nerede yaşandığını ve neden önemli olduğunu anlamak için şehirleri ve bölgeleri öğren. Ekonomik merkezlerden jeopolitik kaynama noktalarına kadar: yerleri bilmek uluslararası ilişkileri kavramana yardımcı olur.",
        card2ImageAlt: "bölgeler ve şehirler",
        card3Title: "Sınır tanımayan bilgi yarışmaları",
        card3Description: "Coğrafyanın ötesine geçen eğlenceli soru yarışmalarıyla bilgini sına. İnsanlar ve yerler arasındaki gizli bağlantıları açığa çıkaran şaşırtıcı gerçekleri keşfet: dünyanın her köşesi birbirine bağlıdır.",
        card3ImageAlt: "coğrafyanın ötesinde bilgi yarışması",
        ctaSrText: "Küresel yolculuğuna başla",
        learnMoreText: "Keşfetmeye başla",
        paymentInfoText: "Bir bilgi ustası ol",
    },

    featureThreeImage: {
        title: "Oyna --> Öğren --> Hatırla",
        cards: [
            {
                title: "OYNA",
                text: `JordGlobe, dünyayı öğrenmeyi eğlenceli ve doğal kılan rahat bir oyundur. İlgi çekici mekanikler, ekran süresini değerli anlara dönüştürür.`,
                image: play,
            },
            {
                title: "ÖĞREN",
                text: `Oyun seviyene uyum sağlar ve hatalarından öğrenmene yardımcı olur. ABD'nin 50 eyaleti gibi karmaşık konular kısa seanslar sayesinde erişilebilir hale gelir. Sorular stratejik biçimde tekrarlanır ve hâkim olman gerekenlere odaklanır.`,
                image: learn,
            },
            {
                title: "HATIRLA",
                text: `Hafıza Madalyaları seni en uygun aralıklarla test ederek uzun vadeli hatırlamayı ödüllendirir. Her doğru cevapta tekrarlar arasındaki süre uzar. Minimum çabayla yıllarca sürecek bilgi inşa et.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Hafıza teknikleri",
    featureCardsSmall2: [
        {
            title: "Loci yöntemi",
            text: `Yerküreyi kendi hafıza sarayına dönüştür. Her yer güçlü bir bilgi çıpasına dönüşür ve coğrafya doğal bir hafıza haritasına evrilir.`,
            image: methodOfLoci,
        },
        {
            title: "Bağlamsal hafıza",
            text: `Yeni bilgi mevcut hatıralara ne kadar çok bağlanırsa onu kalıcı bir hatıraya dönüştürmek o kadar kolay olur.`,
            image: contextualMemory,
        },
        {
            title: "Aralıklı tekrar",
            text: `Bilgiyi giderek artan aralıklarla tekrar et ve minimum çabayla kalıcı hatıralar oluştur.`,
            image: spacedRepetition,
        },
        {
            title: "Çift kodlama",
            text: `Bilgi aynı anda birden fazla biçimde sunulduğunda en iyi şekilde öğrenirsin (ör. resim, metin ve harita).`,
            image: dualCoding,
        },
        {
            title: "Aralıklı öğrenme",
            text: `Bilgiyi farklı bağlamlarda uygulamak zorunda kaldığında daha iyi hatırlarsın.`,
            image: interleaving,
        },
        {
            title: "Rahat oyun",
            text: `Ödüller, animasyonlar ve oyun tasarımı öğrenmeyi bağımlılık yapacak kadar keyifli kılar.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Kullanıcı yorumları",
    testimonialsDescription: "Kullanıcıların JordGlobe hakkında ne söylediğini gör",

    featureVideo: {
        title: "Oynanış videosu",
        playButtonAriaLabel: "videoyu oynat",
        imageAlt: "fragman",
    },
};

export default siteData;
