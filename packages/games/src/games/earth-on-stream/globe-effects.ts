import type { EarthGlobe } from '../../earth-globe/earth-globe';
import { burstAtPosition } from '../../shared/effects/marker-particles';

export function playCorrectEffect(globe: EarthGlobe, markerId: number): Promise<void> {
    return new Promise((resolve) => {
        const pos = globe.getMarkerPosition(markerId);
        if (!pos) {
            globe.releaseMarker(markerId);
            resolve();
            return;
        }

        burstAtPosition(globe.getScene(), pos, {
            count: 20,
            maxEmitPower: 0.35,
            lifetimeMax: 0.6,
        });

        globe.setMarkerScale(markerId, 2.0);

        let frame = 0;
        const totalFrames = 20;
        function animatePulse() {
            frame++;
            const t = frame / totalFrames;
            const scale = 2.0 - t * 1.0;
            globe.setMarkerScale(markerId, Math.max(scale, 1.0));

            if (frame < totalFrames) {
                requestAnimationFrame(animatePulse);
            } else {
                globe.releaseMarker(markerId);
                resolve();
            }
        }
        requestAnimationFrame(animatePulse);
    });
}
