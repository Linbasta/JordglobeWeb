/**
 * Default score-level sprites and tier keys for result-overlay.
 *
 * Games that don't specify their own sprites/names inherit these ten generic
 * tiers. To override, pass custom sprites/spriteNames to showResultOverlay.
 */

import tier1 from './score-levels/1.png?url'
import tier2 from './score-levels/2.png?url'
import tier3 from './score-levels/3.png?url'
import tier4 from './score-levels/4.png?url'
import tier5 from './score-levels/5.png?url'
import tier6 from './score-levels/6.png?url'
import tier7 from './score-levels/7.png?url'
import tier8 from './score-levels/8.png?url'
import tier9 from './score-levels/9.png?url'
import tier10 from './score-levels/10.png?url'
import { t } from '../i18n/i18n'

export const DEFAULT_SCORE_LEVEL_SPRITES: string[] = [
    tier1, tier2, tier3, tier4, tier5, tier6, tier7, tier8, tier9, tier10,
]

export function getDefaultTierNames(): string[] {
    return DEFAULT_SCORE_LEVEL_SPRITES.map((_, i) => t(`tier.${i}`))
}
