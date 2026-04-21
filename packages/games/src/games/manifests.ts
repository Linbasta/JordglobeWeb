import { manifest as eurovision } from './eurovision/manifest';
import { manifest as medals } from './medals/manifest';
import type { GameManifest } from './types';

export const manifests: GameManifest[] = [eurovision, medals];
