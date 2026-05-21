import { asset } from '../../shared/asset-path';

const TRACKS = [
    asset('sfx/Cartography Countdown.mp3'),
    asset('sfx/Cartography Countdown 2.mp3'),
    asset('sfx/Cartography Countdown 3.mp3'),
];

const CROSSFADE_DURATION = 2;

let audios: HTMLAudioElement[] = [];
let activeIndex = -1;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let scheduleTimers: ReturnType<typeof setTimeout>[] = [];

function createAudio(src: string): HTMLAudioElement {
    const a = new Audio(src);
    a.loop = true;
    a.volume = 0;
    return a;
}

function stopFade() {
    if (fadeInterval) {
        clearInterval(fadeInterval);
        fadeInterval = null;
    }
}

function crossfadeTo(nextIndex: number, positionFraction: number) {
    stopFade();

    const prev = audios[activeIndex];
    const next = audios[nextIndex];
    if (!prev || !next) return;

    next.currentTime = positionFraction * next.duration;
    next.volume = 0;
    next.play().catch(() => {});

    const steps = CROSSFADE_DURATION * 20;
    let step = 0;
    const prevStartVol = prev.volume;

    fadeInterval = setInterval(() => {
        step++;
        const t = step / steps;
        prev.volume = prevStartVol * (1 - t);
        next.volume = t;

        if (step >= steps) {
            stopFade();
            prev.pause();
            prev.volume = 0;
            next.volume = 1;
            activeIndex = nextIndex;
        }
    }, CROSSFADE_DURATION * 1000 / steps);

    activeIndex = nextIndex;
}

export function startRoundMusic(roundDuration: number) {
    stopRoundMusic();

    audios = TRACKS.map(createAudio);

    const firstSwitchAt = 60;
    const secondSwitchAt = roundDuration - 15;

    activeIndex = 0;
    audios[0].volume = 1;
    audios[0].play().catch(() => {});

    if (firstSwitchAt < roundDuration) {
        scheduleTimers.push(setTimeout(() => {
            const fraction = audios[0].currentTime / audios[0].duration;
            crossfadeTo(1, fraction);
        }, firstSwitchAt * 1000));
    }

    if (secondSwitchAt > firstSwitchAt) {
        scheduleTimers.push(setTimeout(() => {
            const current = audios[activeIndex];
            const fraction = current.currentTime / current.duration;
            crossfadeTo(2, fraction);
        }, secondSwitchAt * 1000));
    }
}

export function stopRoundMusic() {
    stopFade();
    for (const t of scheduleTimers) clearTimeout(t);
    scheduleTimers = [];
    for (const a of audios) {
        a.pause();
        a.src = '';
    }
    audios = [];
    activeIndex = -1;
}
