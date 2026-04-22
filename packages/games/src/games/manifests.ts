import { manifest as euroMusicQuiz } from './euro-music-quiz/manifest';
import { quizManifests } from './quiz/quiz-manifests';
import type { GameManifest } from './types';

export const manifests: GameManifest[] = [euroMusicQuiz, ...quizManifests];
