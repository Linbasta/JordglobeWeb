/**
 * Patched ArcRotateCamera pointer input that suppresses rotation during
 * pinch transitions. Fixes Firefox Android bug where coordinate jumps
 * during 1→2 and 2→1 pointer transitions cause unwanted rotation.
 *
 * Pointer count is sourced from native canvas pointer events rather than
 * Babylon's filtered onButtonDown/Up chain, so iOS pointercancel events
 * reliably clean up and can't leave rotation permanently blocked.
 */

import { ArcRotateCameraPointersInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';

const GRACE_MS = 150;

export class PatchedArcRotatePointersInput extends ArcRotateCameraPointersInput {
    private _activePointerIds = new Set<number>();
    private _lastMultiTouchTime = 0;
    private _trackedElement: HTMLElement | null = null;

    private _onPointerDown = (e: PointerEvent): void => {
        const wasMulti = this._activePointerIds.size >= 2;
        this._activePointerIds.add(e.pointerId);
        if (this._activePointerIds.size >= 2 && !wasMulti) {
            this._lastMultiTouchTime = performance.now();
        }
    };

    private _onPointerRemove = (e: PointerEvent): void => {
        if (!this._activePointerIds.has(e.pointerId)) return;
        const wasMulti = this._activePointerIds.size >= 2;
        this._activePointerIds.delete(e.pointerId);
        if (wasMulti) {
            this._lastMultiTouchTime = performance.now();
        }
    };

    attachControl(noPreventDefault?: boolean): void {
        super.attachControl(noPreventDefault);
        const element = this.camera.getEngine().getInputElement();
        if (!element) return;
        this._trackedElement = element;
        element.addEventListener('pointerdown', this._onPointerDown);
        // Listen on window so drag-off-canvas releases and iOS pointercancel
        // always clean up the pointer set, no matter where the event lands.
        window.addEventListener('pointerup', this._onPointerRemove);
        window.addEventListener('pointercancel', this._onPointerRemove);
    }

    detachControl(): void {
        if (this._trackedElement) {
            this._trackedElement.removeEventListener('pointerdown', this._onPointerDown);
            this._trackedElement = null;
        }
        window.removeEventListener('pointerup', this._onPointerRemove);
        window.removeEventListener('pointercancel', this._onPointerRemove);
        this._activePointerIds.clear();
        this._lastMultiTouchTime = 0;
        super.detachControl();
    }

    onTouch(point: any, offsetX: number, offsetY: number): void {
        if (this._activePointerIds.size >= 2 || performance.now() - this._lastMultiTouchTime < GRACE_MS) {
            return;
        }
        super.onTouch(point, offsetX, offsetY);
    }

    onLostFocus(): void {
        this._activePointerIds.clear();
        this._lastMultiTouchTime = 0;
        super.onLostFocus();
    }
}
