/**
 * Pin UI Component
 *
 * Manages the pin button and bottom panel UI elements.
 * Shared between solo and party applications.
 */

import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { Image } from '@babylonjs/gui/2D/controls/image';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';

export interface PinUIElements {
    pinButton: Image;
    bottomPanel: Rectangle;
}

export interface PinUICallbacks {
    onPinButtonPress?: () => void;
    onPinButtonRelease?: () => void;
}

export class PinUI {
    private advancedTexture: AdvancedDynamicTexture;
    private pinButton: Image | null = null;
    private bottomPanel: Rectangle | null = null;
    private callbacks: PinUICallbacks = {};

    constructor(advancedTexture: AdvancedDynamicTexture) {
        this.advancedTexture = advancedTexture;
    }

    /**
     * Create the complete pin UI (button + bottom panel)
     */
    create(callbacks?: PinUICallbacks): PinUIElements {
        this.callbacks = callbacks || {};

        // Create pin button
        this.pinButton = this.createPinButton();
        this.advancedTexture.addControl(this.pinButton);

        // Create bottom panel
        this.bottomPanel = this.createBottomPanel();
        this.advancedTexture.addControl(this.bottomPanel);

        // Setup interactions
        this.setupPinButtonInteraction();

        return {
            pinButton: this.pinButton,
            bottomPanel: this.bottomPanel
        };
    }

    /**
     * Create just the pin button (without adding to texture)
     */
    private createPinButton(): Image {
        const pinScale = 0.5;
        const pinButton = new Image("pinButton", "/DefaultPin.png");
        pinButton.width = `${196 * pinScale}px`;
        pinButton.height = `${900 * pinScale}px`;
        pinButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        pinButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        pinButton.top = "300px";
        pinButton.left = "50px";
        pinButton.rotation = 0.14;
        pinButton.isPointerBlocker = true;

        return pinButton;
    }

    /**
     * Create the bottom panel (without adding to texture)
     */
    private createBottomPanel(): Rectangle {
        const panel = new Rectangle("bottomPanel");
        panel.width = "600px";
        panel.height = "50px";
        panel.thickness = 0;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.top = "5%";
        panel.background = "#6496DC";
        panel.alpha = 1.0;
        panel.cornerRadius = 60;
        panel.isPointerBlocker = false;  // Allow pointer events to pass through to canvas

        return panel;
    }

    /**
     * Setup pin button press/release interactions
     */
    private setupPinButtonInteraction(): void {
        if (!this.pinButton) return;

        this.pinButton.onPointerDownObservable.add(() => {
            if (this.pinButton) {
                this.pinButton.scaleX = 0.95;
                this.pinButton.scaleY = 0.95;
            }
            if (this.callbacks.onPinButtonPress) {
                this.callbacks.onPinButtonPress();
            }
        });

        this.pinButton.onPointerUpObservable.add(() => {
            if (this.pinButton) {
                this.pinButton.scaleX = 1.0;
                this.pinButton.scaleY = 1.0;
            }
            if (this.callbacks.onPinButtonRelease) {
                this.callbacks.onPinButtonRelease();
            }
        });
    }

    /**
     * Show or hide the pin button
     */
    setPinButtonVisible(visible: boolean): void {
        if (this.pinButton) {
            this.pinButton.isVisible = visible;
        }
    }

    /**
     * Show or hide the bottom panel
     */
    setBottomPanelVisible(visible: boolean): void {
        if (this.bottomPanel) {
            this.bottomPanel.isVisible = visible;
        }
    }

    /**
     * Get the pin button element
     */
    getPinButton(): Image | null {
        return this.pinButton;
    }

    /**
     * Get the bottom panel element
     */
    getBottomPanel(): Rectangle | null {
        return this.bottomPanel;
    }

    /**
     * Dispose of all UI elements
     */
    dispose(): void {
        if (this.pinButton) {
            this.advancedTexture.removeControl(this.pinButton);
            this.pinButton.dispose();
            this.pinButton = null;
        }
        if (this.bottomPanel) {
            this.advancedTexture.removeControl(this.bottomPanel);
            this.bottomPanel.dispose();
            this.bottomPanel = null;
        }
    }
}
