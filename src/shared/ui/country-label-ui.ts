/**
 * Country Label UI Module
 * Displays a country name card at the top of the screen
 * This is a work-in-progress feature for future use
 */

import { AdvancedDynamicTexture, Image, TextBlock, Control } from '@babylonjs/gui';

export class CountryLabelUI {
    private advancedTexture: AdvancedDynamicTexture;
    private countryCard: Image | null = null;
    private countryText: TextBlock | null = null;

    constructor(advancedTexture: AdvancedDynamicTexture) {
        this.advancedTexture = advancedTexture;
    }

    /**
     * Calculate the required width for the label based on text length
     * Uses approximation: characterCount * fontSize * 0.6 (for bold fonts)
     */
    private calculateWidth(text: string): number {
        const fontSize = 32;
        const characterWidth = 0.6; // Approximation for bold fonts
        const padding = 60; // 30px left + 30px right
        const minWidth = 300;
        const maxWidth = 600;

        const estimatedWidth = text.length * fontSize * characterWidth + padding;
        return Math.max(minWidth, Math.min(maxWidth, estimatedWidth));
    }

    /**
     * Show the country label card with the given country name
     * Reuses existing controls if they exist (pooling pattern)
     */
    show(countryName: string): void {
        // Calculate dynamic width based on text length
        const width = this.calculateWidth(countryName);
        const widthPx = `${width}px`;

        // If controls already exist, just update them (pooling pattern)
        if (this.countryCard && this.countryText) {
            this.countryText.text = countryName;
            this.countryCard.width = widthPx;
            this.countryText.width = widthPx;
            console.log(`Country label updated: ${countryName} (width: ${width}px)`);
            return;
        }

        // Create nine-patch country card at top center
        this.countryCard = new Image("countryCard", "/question_card_simple.png");
        this.countryCard.width = widthPx;
        this.countryCard.height = "100px";
        this.countryCard.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.countryCard.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.countryCard.top = "20px";
        this.countryCard.isPointerBlocker = false;

        // Set nine-patch stretch mode
        this.countryCard.stretch = Image.STRETCH_NINE_PATCH;

        // Set slice values - these are absolute positions from origin for a 101x101 image
        this.countryCard.sliceLeft = 10;    // Left border ends at x=10
        this.countryCard.sliceRight = 91;   // Right border starts at x=91 (101-10)
        this.countryCard.sliceTop = 10;     // Top border ends at y=10
        this.countryCard.sliceBottom = 91;  // Bottom border starts at y=91 (101-10)

        // Add card to GUI
        this.advancedTexture.addControl(this.countryCard);

        // Create text for the country name (layered on top)
        this.countryText = new TextBlock("countryText", countryName);
        this.countryText.width = widthPx;
        this.countryText.height = "100px";
        this.countryText.color = "#003366";  // Dark blue color
        this.countryText.fontSize = 32;
        this.countryText.fontWeight = "bold";
        this.countryText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.countryText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.countryText.top = "20px";
        this.countryText.isPointerBlocker = false;

        // Add text to GUI (on top of the card)
        this.advancedTexture.addControl(this.countryText);

        console.log(`Country label created: ${countryName} (width: ${width}px)`);
    }

    /**
     * Hide the country label
     */
    hide(): void {
        if (this.countryCard) {
            this.advancedTexture.removeControl(this.countryCard);
            this.countryCard.dispose();
            this.countryCard = null;
        }

        if (this.countryText) {
            this.advancedTexture.removeControl(this.countryText);
            this.countryText.dispose();
            this.countryText = null;
        }
    }

    /**
     * Update the displayed country name
     */
    updateCountry(countryName: string): void {
        if (this.countryText && this.countryCard) {
            // Update text content
            this.countryText.text = countryName;

            // Recalculate and update width for new text
            const width = this.calculateWidth(countryName);
            const widthPx = `${width}px`;
            this.countryCard.width = widthPx;
            this.countryText.width = widthPx;
        } else {
            // If not visible, show it
            this.show(countryName);
        }
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.hide();
    }
}
