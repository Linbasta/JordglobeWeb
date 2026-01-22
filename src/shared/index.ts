/**
 * Shared Components Index
 * Central export point for all shared components used by solo and party applications
 */

// Controllers
export { BaseGameController } from './controllers/BaseGameController';
export type { BaseGameOptions } from './controllers/BaseGameController';

// Managers
export { PinManager } from './managers/PinManager';
export { MultiPinManager } from './managers/MultiPinManager';
export { DistanceLabelManager } from './managers/DistanceLabelManager';
export type { PlayerPin } from './managers/MultiPinManager';

// Visualizers
export { ArcDrawer } from './visualizers/ArcDrawer';
export { RevealVisualizer } from './visualizers/RevealVisualizer';

// Animation
export { PinRecorder } from './animation/PinRecorder';
export { PinReplayAnimator } from './animation/PinReplayAnimator';
export { CameraAnimator } from './animation/CameraAnimator';
export type { PinRecording, RecordedPosition } from './animation/PinRecorder';

// Behaviors
export { CountrySelectionBehavior } from './behaviors/CountrySelectionBehavior';
export type { SelectionBehaviorOptions, SetAltitudeCallback, GetAltitudeCallback, SetSaturationCallback, GetSaturationCallback } from './behaviors/CountrySelectionBehavior';

// UI
export { CountryLabelUI } from './ui/CountryLabelUI';
export { PinUI } from './ui/PinUI';
export type { PinUIElements, PinUICallbacks } from './ui/PinUI';
