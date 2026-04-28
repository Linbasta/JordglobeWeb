import { manifest as euroMusicQuiz } from './euro-music-quiz/manifest';
import { manifest as euroWinners2000s } from './euro-winners-2000s/manifest';
import { quizManifests } from './quiz/quiz-manifests';
import type { GameManifest } from './types';

export const manifests: GameManifest[] = [euroMusicQuiz, euroWinners2000s, ...quizManifests];
