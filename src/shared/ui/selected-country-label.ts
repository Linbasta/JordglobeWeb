/**
 * Selected Country Label UI Module
 * Displays the currently hovered/selected country name at the bottom of the screen
 */

import { AdvancedDynamicTexture, Image, TextBlock, Control } from '@babylonjs/gui';

export class SelectedCountryLabel {
    private advancedTexture: AdvancedDynamicTexture;
    private countryCard: Image | null = null;
    private countryText: TextBlock | null = null;
    private isVisible: boolean = false;

    constructor(advancedTexture: AdvancedDynamicTexture) {
        this.advancedTexture = advancedTexture;
        this.createUI();
    }

    /**
     * Create the UI elements (initially hidden)
     */
    private createUI(): void {
        // Create nine-patch country card at bottom center
        this.countryCard = new Image("selectedCountryCard", "/BlueButton.png");
        this.countryCard.width = "250px";
        this.countryCard.height = "80px";
        this.countryCard.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.countryCard.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.countryCard.top = "-30px";
        this.countryCard.isPointerBlocker = false;
        this.countryCard.isVisible = false;

        // Set nine-patch stretch mode
        this.countryCard.stretch = Image.STRETCH_NINE_PATCH;

        // Set slice values for 101x101 image
        this.countryCard.sliceLeft = 10;
        this.countryCard.sliceRight = 91;
        this.countryCard.sliceTop = 10;
        this.countryCard.sliceBottom = 91;

        // Add card to GUI
        this.advancedTexture.addControl(this.countryCard);

        // Create text for the country name (layered on top)
        this.countryText = new TextBlock("selectedCountryText", "");
        this.countryText.width = "250px";
        this.countryText.height = "80px";
        this.countryText.color = "white";
        this.countryText.fontSize = 24;
        this.countryText.fontWeight = "bold";
        this.countryText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.countryText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.countryText.top = "-30px";
        this.countryText.isPointerBlocker = false;
        this.countryText.isVisible = false;

        // Add text to GUI (on top of the card)
        this.advancedTexture.addControl(this.countryText);
    }

    /**
     * Show the selected country label with the given country name
     */
    show(countryName: string): void {
        if (this.countryCard && this.countryText) {
            this.countryText.text = countryName;
            this.countryCard.isVisible = true;
            this.countryText.isVisible = true;
            this.isVisible = true;
        }
    }

    /**
     * Hide the selected country label
     */
    hide(): void {
        if (this.countryCard && this.countryText) {
            this.countryCard.isVisible = false;
            this.countryText.isVisible = false;
            this.isVisible = false;
        }
    }

    /**
     * Update the displayed country name (shows if hidden)
     */
    updateCountry(countryName: string): void {
        if (this.countryText) {
            this.countryText.text = countryName;
            if (!this.isVisible) {
                this.show(countryName);
            }
        }
    }

    /**
     * Clean up resources
     */
    dispose(): void {
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
}
