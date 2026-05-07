import { type FaqItem } from "../types/configDataTypes";

// Combine faqTitle and faqData into one object.
const faq = {
	title: "Συχνές ερωτήσεις",
	items: [
		{
			question: "Πώς καθορίζονται τα σύνορα;",
			answer: `Ακολουθούμε τις κατευθυντήριες γραμμές του ΟΗΕ για να είμαστε όσο το δυνατόν πιο ουδέτεροι. Ωστόσο, η χάραξη συνόρων μπορεί να είναι περίπλοκη και δεν αντικατοπτρίζει πάντα την τρέχουσα κατάσταση. Ενημερώστε μας αν δείτε κάτι ανακριβές.`,
		},
		// ...additional FAQ items...
	],
};

export default faq;
