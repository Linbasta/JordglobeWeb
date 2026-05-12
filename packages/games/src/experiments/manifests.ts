import type { GameManifest } from '../games/types';
import { manifest as countryQuiz } from './country-quiz/manifest';
import { manifest as capitalsQuiz } from './capitals-quiz/manifest';
import { manifest as globeTaxi } from './globe-taxi/manifest';
import { manifest as party } from './party/manifest';
import { manifest as host } from './host/manifest';

export const manifests: GameManifest[] = [countryQuiz, capitalsQuiz, globeTaxi, party, host];
