/**
 * Shared Components Index
 * Central export point for all shared components used by solo and party applications
 */

// Controllers
export { BaseGameController } from './controllers/BaseGameController';
export type { BaseGameOptions } from './controllers/BaseGameController';

// Managers
export { initPinManager, enterPlacingMode, exitPlacingMode, isPlacing, getPreviewPin, getRecordedPositions, clearRecordedPositions, onPinPlaced, onCountryHover, onPlacingModeChange } from './managers/PinManager';
export { MultiPinManager } from './managers/MultiPinManager';
export { DistanceLabelManager } from './managers/DistanceLabelManager';
export type { PlayerPin } from './managers/MultiPinManager';

// Visualizers
export { ArcDrawer } from './visualizers/ArcDrawer';
export { RevealVisualizer } from './visualizers/RevealVisualizer';

// Animation
export { PinRecorder } from './animation/PinRecorder';
export { PinReplayAnimator } from './animation/PinReplayAnimator';
export { animateToLocation, frameCountry, cameraShake, getZoomValue } from './animation/cameraUtils';
export type { ViewportRegion } from './animation/cameraUtils';
export type { PinRecording, RecordedPosition } from './animation/PinRecorder';

// Behaviors
export { handleHover, clearSelection } from './behaviors/countrySelection';

// UI
export { CountryLabelUI } from './ui/CountryLabelUI';
export { PinUI } from './ui/PinUI';
export type { PinUIElements, PinUICallbacks } from './ui/PinUI';
