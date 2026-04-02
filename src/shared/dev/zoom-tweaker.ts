/**
 * Zoom Tweaker — dev-only slider panel for live-tuning zoom values
 *
 * Toggle with Z key. Values are written directly into the mutable `zoom`
 * object in constants.ts, so every consumer picks them up next frame.
 *
 * Guarded by dynamic import + import.meta.env.DEV at the call site,
 * so this module tree-shakes completely from production builds.
 */

import { zoom } from '../../earth-globe/constants';

const SLIDER_CONFIG: { key: keyof typeof zoom; constant: string; label: string; min: number; max: number; step: number }[] = [
    { key: 'threshold',            constant: 'ZOOM_THRESHOLD',              label: 'Threshold',          min: 3,     max: 20,   step: 0.5   },
    { key: 'pinScaleClose',        constant: 'ZOOM_PIN_SCALE_CLOSE',       label: 'Pin Scale Close',    min: 1,     max: 50,   step: 1     },
    { key: 'pinScaleFar',          constant: 'ZOOM_PIN_SCALE_FAR',         label: 'Pin Scale Far',      min: 50,    max: 500,  step: 5     },
    { key: 'borderThicknessClose', constant: 'ZOOM_BORDER_THICKNESS_CLOSE', label: 'Border Close',      min: 0.1,   max: 2,    step: 0.05  },
    { key: 'borderThicknessFar',   constant: 'ZOOM_BORDER_THICKNESS_FAR',  label: 'Border Far',         min: 0.5,   max: 5,    step: 0.1   },
    { key: 'markerScaleClose',     constant: 'ZOOM_MARKER_SCALE_CLOSE',    label: 'Marker Scale Close', min: 0.05,  max: 1,    step: 0.01  },
    { key: 'markerScaleFar',       constant: 'ZOOM_MARKER_SCALE_FAR',      label: 'Marker Scale Far',   min: 0.2,   max: 3,    step: 0.05  },
    { key: 'markerHitRadiusClose', constant: 'ZOOM_MARKER_HIT_RADIUS_CLOSE', label: 'Hit Radius Close', min: 0.005, max: 0.1,  step: 0.005 },
    { key: 'markerHitRadiusFar',   constant: 'ZOOM_MARKER_HIT_RADIUS_FAR', label: 'Hit Radius Far',    min: 0.02,  max: 0.5,  step: 0.01  },
    { key: 'colliderScaleClose',   constant: 'ZOOM_COLLIDER_SCALE_CLOSE',  label: 'Collider Close',     min: 0.5,   max: 3,    step: 0.1   },
    { key: 'colliderScaleFar',     constant: 'ZOOM_COLLIDER_SCALE_FAR',    label: 'Collider Far',       min: 1,     max: 5,    step: 0.1   },
];

const DEFAULTS: Record<string, number> = { ...zoom };

let panel: HTMLDivElement | null = null;

export function toggleZoomPanel(): void {
    if (panel) {
        panel.remove();
        panel = null;
        return;
    }

    panel = document.createElement('div');
    panel.id = 'zoomTweakerPanel';
    panel.style.cssText =
        'position:fixed;top:100px;right:20px;width:320px;max-height:80vh;overflow-y:auto;' +
        'background:rgba(30,30,30,0.95);color:#eee;padding:16px;border-radius:8px;' +
        'font:12px/1.6 monospace;z-index:1000;';

    const title = document.createElement('div');
    title.textContent = 'Zoom Tweaker (Z to close)';
    title.style.cssText = 'font-size:14px;font-weight:bold;margin-bottom:12px;';
    panel.appendChild(title);

    const valueLabels: Map<string, HTMLSpanElement> = new Map();

    for (const cfg of SLIDER_CONFIG) {
        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom:8px;';

        const label = document.createElement('div');
        label.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:2px;';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = cfg.label;

        const valueSpan = document.createElement('span');
        valueSpan.textContent = String(zoom[cfg.key]);
        valueLabels.set(cfg.key, valueSpan);

        label.appendChild(nameSpan);
        label.appendChild(valueSpan);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = String(cfg.min);
        slider.max = String(cfg.max);
        slider.step = String(cfg.step);
        slider.value = String(zoom[cfg.key]);
        slider.style.cssText = 'width:100%;';

        slider.addEventListener('input', () => {
            const v = parseFloat(slider.value);
            zoom[cfg.key] = v;
            valueSpan.textContent = String(v);
        });

        row.appendChild(label);
        row.appendChild(slider);
        panel.appendChild(row);
    }

    // Button row
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-top:12px;';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.style.cssText = 'flex:1;padding:6px;cursor:pointer;border:none;border-radius:4px;background:#555;color:#eee;font:12px monospace;';
    resetBtn.addEventListener('click', () => {
        for (const cfg of SLIDER_CONFIG) {
            zoom[cfg.key] = DEFAULTS[cfg.key];
        }
        // Update all sliders and labels
        const sliders = panel!.querySelectorAll('input[type=range]');
        sliders.forEach((el, i) => {
            const s = el as HTMLInputElement;
            const cfg = SLIDER_CONFIG[i];
            s.value = String(zoom[cfg.key]);
            valueLabels.get(cfg.key)!.textContent = String(zoom[cfg.key]);
        });
    });

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cssText = 'flex:1;padding:6px;cursor:pointer;border:none;border-radius:4px;background:#555;color:#eee;font:12px monospace;';
    copyBtn.addEventListener('click', () => {
        const lines = SLIDER_CONFIG.map(cfg => `${cfg.constant} = ${zoom[cfg.key]}`);
        navigator.clipboard.writeText(lines.join('\n'));
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });

    btnRow.appendChild(resetBtn);
    btnRow.appendChild(copyBtn);
    panel.appendChild(btnRow);

    document.body.appendChild(panel);
}
