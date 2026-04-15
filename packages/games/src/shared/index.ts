/**
 * Shared Components Index
 * Central export point for all shared components used by solo and party applications
 */

// Controllers
export { BaseGameController } from './controllers/base-game-controller';
export type { BaseGameOptions } from './controllers/base-game-controller';

// Managers
export { initPinManager, enterPlacingMode, exitPlacingMode, isPlacing, getPreviewPin, getRecordedPositions, clearRecordedPositions, onPinPlaced, onCountryHover, onPlacingModeChange, onCancelZoneChange } from './managers/pin-manager';
export { MultiPinManager } from './managers/multi-pin-manager';
export { DistanceLabelManager } from './managers/distance-label-manager';
export type { PlayerPin } from './managers/multi-pin-manager';

// Visualizers
export { ArcDrawer } from './visualizers/arc-drawer';
export { RevealVisualizer } from './visualizers/reveal-visualizer';

// Animation
export { PinRecorder } from './animation/pin-recorder';
export { PinReplayAnimator } from './animation/pin-replay-animator';
export { animateToLocation, frameCountry, cameraShake, getZoomValue } from './animation/camera-utils';
export type { ViewportRegion } from './animation/camera-utils';
export type { PinRecording, RecordedPosition } from './animation/pin-recorder';

// Behaviors
export { handleHover, clearSelection } from './behaviors/region-selection';

// UI
export { CountryLabelUI } from './ui/country-label-ui';
export { PinUI } from './ui/pin-ui';
export type { PinUIElements, PinUICallbacks } from './ui/pin-ui';
