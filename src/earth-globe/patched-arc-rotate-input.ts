/**
 * Patched ArcRotateCamera pointer input that suppresses rotation during
 * pinch transitions. Fixes Firefox Android bug where coordinate jumps
 * during 1→2 and 2→1 pointer transitions cause unwanted rotation.
 */

import { ArcRotateCameraPointersInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';

const GRACE_MS = 150;

export class PatchedArcRotatePointersInput extends ArcRotateCameraPointersInput {
    private _pointerCount = 0;
    private _lastMultiTouchTime = 0;

    onButtonDown(evt: any): void {
        this._pointerCount++;
        if (this._pointerCount >= 2) {
            this._lastMultiTouchTime = performance.now();
        }
        super.onButtonDown(evt);
    }

    onButtonUp(evt: any): void {
        if (this._pointerCount >= 2) {
            this._lastMultiTouchTime = performance.now();
        }
        this._pointerCount = Math.max(0, this._pointerCount - 1);
        super.onButtonUp(evt);
    }

    onTouch(point: any, offsetX: number, offsetY: number): void {
        if (this._pointerCount >= 2 || performance.now() - this._lastMultiTouchTime < GRACE_MS) {
            return;
        }
        super.onTouch(point, offsetX, offsetY);
    }

    onLostFocus(): void {
        this._pointerCount = 0;
        this._lastMultiTouchTime = 0;
        super.onLostFocus();
    }
}
