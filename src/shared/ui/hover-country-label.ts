/**
 * Hover Country Label UI Module
 * Displays country name at the pin/cursor location in 3D space
 */

import { AdvancedDynamicTexture, TextBlock, Control } from '@babylonjs/gui';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';

export class HoverCountryLabel {
    private advancedTexture: AdvancedDynamicTexture;
    private labelText: TextBlock | null = null;
    private anchorNode: TransformNode | null = null;

    constructor(advancedTexture: AdvancedDynamicTexture) {
        this.advancedTexture = advancedTexture;
        this.createLabel();
    }

    /**
     * Create the 3D-linked label
     */
    private createLabel(): void {
        this.labelText = new TextBlock("hoverCountryLabel", "");
        this.labelText.color = "white";
        this.labelText.fontSize = 28;
        this.labelText.fontWeight = "bold";
        this.labelText.outlineWidth = 4;
        this.labelText.outlineColor = "black";
        this.labelText.isVisible = false;

        // Position offset from the 3D point (above the pin)
        this.labelText.top = "-40px";

        this.advancedTexture.addControl(this.labelText);
    }

    /**
     * Link the label to a 3D mesh/node (e.g., the pin preview)
     */
    linkToNode(node: TransformNode): void {
        if (this.labelText) {
            this.anchorNode = node;
            this.labelText.linkWithMesh(node);
            this.labelText.linkOffsetY = -40; // Position above the pin
        }
    }

    /**
     * Show the label with country name
     */
    show(countryName: string): void {
        if (this.labelText) {
            this.labelText.text = countryName;
            this.labelText.isVisible = true;
        }
    }

    /**
     * Hide the label
     */
    hide(): void {
        if (this.labelText) {
            this.labelText.isVisible = false;
        }
    }

    /**
     * Update the displayed country name
     */
    updateCountry(countryName: string): void {
        if (this.labelText) {
            this.labelText.text = countryName;
            if (!this.labelText.isVisible) {
                this.labelText.isVisible = true;
            }
        }
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        if (this.labelText) {
            this.advancedTexture.removeControl(this.labelText);
            this.labelText.dispose();
            this.labelText = null;
        }
        this.anchorNode = null;
    }
}
