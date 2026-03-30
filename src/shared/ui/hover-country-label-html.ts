/**
 * Hover Country Label (HTML version)
 *
 * Displays country name as an HTML element positioned above the pin.
 * Uses native DOM rendering for crisper text than Babylon.js GUI.
 */

import type { Scene } from '@babylonjs/core/scene';
import type { Camera } from '@babylonjs/core/Cameras/camera';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';

export class HoverCountryLabelHTML {
    private element: HTMLDivElement;
    private scene: Scene;
    private camera: Camera;
    private anchorNode: TransformNode | null = null;
    private visible = false;

    constructor(scene: Scene, camera: Camera) {
        this.scene = scene;
        this.camera = camera;
        this.element = this.createElement();
        document.body.appendChild(this.element);
    }

    private createElement(): HTMLDivElement {
        const el = document.createElement('div');
        el.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 100;
            color: white;
            font-size: 16px;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-shadow:
                -1px -1px 0 #000,
                 1px -1px 0 #000,
                -1px  1px 0 #000,
                 1px  1px 0 #000,
                 0   -2px 0 #000,
                 0    2px 0 #000,
                -2px  0   0 #000,
                 2px  0   0 #000;
            white-space: nowrap;
            transform: translate(-50%, -100%);
            padding-bottom: 45px;
            display: none;
        `;
        return el;
    }

    /**
     * Link the label to a 3D node (e.g., the pin preview)
     * The label will follow this node's screen position
     */
    linkToNode(node: TransformNode): void {
        this.anchorNode = node;
    }

    /**
     * Update the label's screen position based on the linked node
     */
    updatePosition(): void {
        if (!this.anchorNode || !this.visible) return;

        const worldPos = this.anchorNode.getAbsolutePosition();
        const screenPos = this.worldToScreen(worldPos);

        if (screenPos) {
            this.element.style.left = `${screenPos.x}px`;
            this.element.style.top = `${screenPos.y}px`;
        }
    }

    /**
     * Convert world position to screen coordinates
     */
    private worldToScreen(worldPos: Vector3): { x: number; y: number } | null {
        const engine = this.scene.getEngine();
        const width = engine.getRenderWidth();
        const height = engine.getRenderHeight();

        // Create viewport for projection
        const viewport = new Viewport(0, 0, width, height);

        // Project world position to screen coordinates
        const projected = Vector3.Project(
            worldPos,
            Matrix.Identity(),
            this.scene.getTransformMatrix(),
            viewport
        );

        // Check if behind camera
        if (projected.z > 1) return null;

        return { x: projected.x, y: projected.y };
    }

    /**
     * Show the label with country name
     */
    show(countryName: string): void {
        this.element.textContent = countryName;
        this.element.style.display = 'block';
        this.visible = true;
        this.updatePosition();
    }

    /**
     * Hide the label
     */
    hide(): void {
        this.element.style.display = 'none';
        this.visible = false;
    }

    /**
     * Update the displayed country name
     */
    updateCountry(countryName: string): void {
        this.element.textContent = countryName;
        if (!this.visible) {
            this.element.style.display = 'block';
            this.visible = true;
        }
        this.updatePosition();
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.element.remove();
        this.anchorNode = null;
    }
}
