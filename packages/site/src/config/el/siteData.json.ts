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
    title: "JordGlobe – το απόλυτο παιχνίδι γεωγραφίας",
    description: "Το JordGlobe χρησιμοποιεί εθιστικούς μηχανισμούς παιχνιδιού για να κάνει την εκμάθηση γεωγραφίας διασκεδαστική και εύκολη.",

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
        alt: "JordGlobe – το απόλυτο παιχνίδι γεωγραφίας",
    },

    heroDownload: {
        title: "Παίξε Jordglobe",
        description: "Κατέβασε το Jordglobe και ξεκίνα το ταξίδι σου!",
        appStoreAlt: "Λήψη από το App Store",
        googlePlayAlt: "Διαθέσιμο στο Google Play",
    },

    heroSide: {
        title: "Γίνε μέλος μιας κοινότητας ενθουσιωδών μαθητών",
        description: "Ανταλλάξτε δοκιμασμένες τεχνικές απομνημόνευσης, μοιραστείτε ιδέες και αποκτήστε πρόωρη πρόσβαση σε νέες εκδόσεις και αποκλειστικές λειτουργίες, όπως η δημιουργία δικών σας κουίζ.",
        communityCtaText: "Έλα στην κοινότητά μας",
        imageAlt: "ήρωας της εφαρμογής",
    },

    featureBento: {
        badgeText: "Μάθε παίζοντας",
        sectionTitle: "Το Duolingo της γεωγραφίας",
        card1Title: "Χώρες και σημαίες",
        card1Description: "Κατάκτησε χώρες και σημαίες — τη βασική γνώση που σε βοηθά να καταλαβαίνεις καλύτερα τα νέα, τα διεθνή γεγονότα και τον μεταβαλλόμενο παγκόσμιο χάρτη. Μη χάνεσαι ξανά στις ειδήσεις.",
        card1ImageAlt: "χώρες και σημαίες",
        card1ImageAltLight: "χώρες και σημαίες ανοιχτή έκδοση",
        card2Title: "Περιοχές και πόλεις",
        card2Description: "Μάθε πόλεις και περιοχές για να κατανοείς πού συμβαίνουν τα γεγονότα και γιατί έχουν σημασία. Από οικονομικά κέντρα έως γεωπολιτικές εστίες — η γνώση των τοποθεσιών σε βοηθά να καταλάβεις τις διεθνείς σχέσεις.",
        card2ImageAlt: "περιοχές και πόλεις",
        card3Title: "Κουίζ πέρα από τη γεωγραφία",
        card3Description: "Δοκίμασε τον εαυτό σου με διασκεδαστικές ερωτήσεις που πάνε πέρα από τη γεωγραφία. Ανακάλυψε εκπληκτικά γεγονότα που αποκαλύπτουν τις κρυφές συνδέσεις μεταξύ ανθρώπων και τόπων — κάθε γωνιά της Γης είναι συνδεδεμένη.",
        card3ImageAlt: "κουίζ πέρα από τη γεωγραφία",
        ctaSrText: "Ξεκίνα το ταξίδι σου στον κόσμο",
        learnMoreText: "Άρχισε να εξερευνάς",
        paymentInfoText: "Γίνε δάσκαλος γνώσης",
    },

    featureThreeImage: {
        title: "Παίξε --> Μάθε --> Θυμήσου",
        cards: [
            {
                title: "ΠΑΙΞΕ",
                text: `Το JordGlobe είναι ένα casual παιχνίδι που κάνει την εκμάθηση του κόσμου διασκεδαστική και φυσική. Ελκυστικοί μηχανισμοί παιχνιδιού μετατρέπουν τον χρόνο μπροστά στην οθόνη σε πολύτιμες στιγμές.`,
                image: play,
            },
            {
                title: "ΜΑΘΕ",
                text: `Το παιχνίδι προσαρμόζεται στο επίπεδό σου και σε βοηθά να μαθαίνεις από τα λάθη σου. Σύνθετα θέματα, όπως οι 50 πολιτείες των ΗΠΑ, γίνονται διαχειρίσιμα σε σύντομες συνεδρίες. Οι ερωτήσεις επαναλαμβάνονται στρατηγικά και επικεντρώνονται σε ό,τι χρειάζεται να κατακτήσεις.`,
                image: learn,
            },
            {
                title: "ΘΥΜΗΣΟΥ",
                text: `Τα μετάλλια μνήμης ανταμείβουν τη μακροπρόθεσμη μνήμη σου, εξετάζοντάς σε σε βέλτιστα διαστήματα. Με κάθε επιτυχία, η απόσταση μεταξύ των επαναλήψεων αυξάνεται. Παγίωσε τη γνώση για χρόνια με ελάχιστη προσπάθεια.`,
                image: remember,
            }],
    },
    featureCardsTitle: "Τεχνικές απομνημόνευσης",
    featureCardsSmall2: [
        {
            title: "Μέθοδος των τόπων",
            text: `Μετάτρεψε την υδρόγειο στο δικό σου παλάτι μνήμης. Κάθε τοποθεσία γίνεται ισχυρή άγκυρα για τη γνώση και η γεωγραφία μετατρέπεται σε φυσικό χάρτη μνήμης.`,
            image: methodOfLoci,
        },
        {
            title: "Συμφραζόμενη μνήμη",
            text: `Όσο περισσότερο η νέα γνώση συνδέεται με υπάρχουσες αναμνήσεις, τόσο πιο εύκολα μετατρέπεται σε σταθερή μνήμη.`,
            image: contextualMemory,
        },
        {
            title: "Διαλείπουσα επανάληψη",
            text: `Επανέλαβε τη γνώση σε ολοένα μεγαλύτερα διαστήματα και χτίσε διαρκή μνήμη με ελάχιστη προσπάθεια.`,
            image: spacedRepetition,
        },
        {
            title: "Διπλή κωδικοποίηση",
            text: `Μαθαίνεις καλύτερα όταν η γνώση παρουσιάζεται ταυτόχρονα σε πολλές μορφές (π.χ. εικόνα, κείμενο και χάρτης).`,
            image: dualCoding,
        },
        {
            title: "Εναλλαγή",
            text: `Θυμάσαι καλύτερα όταν εφαρμόζεις τη γνώση σε διαφορετικά πλαίσια.`,
            image: interleaving,
        },
        {
            title: "Casual gaming",
            text: `Ανταμοιβές, animations και σχεδιασμός παιχνιδιού κάνουν τη μάθηση εθιστική.`,
            image: casualGaming,
        }
    ],

    testimonialsTitle: "Σχόλια χρηστών",
    testimonialsDescription: "Τι λένε οι χρήστες για το JordGlobe",

    featureVideo: {
        title: "Βίντεο παιχνιδιού",
        playButtonAriaLabel: "αναπαραγωγή βίντεο",
        imageAlt: "trailer",
    },
};

export default siteData;
