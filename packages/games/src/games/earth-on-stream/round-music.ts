import { asset } from '../../shared/asset-path';

const TRACKS = [
    asset('sfx/Cartography Countdown.mp3'),
    asset('sfx/Cartography Countdown 2.mp3'),
    asset('sfx/Cartography Countdown 3.mp3'),
];
const MENU_TRACK = asset('sfx/EarthOnStreamMenu.mp3');

const CROSSFADE_DURATION = 2;

let musicVolume = 0.5;
const volumeListeners: ((v: number) => void)[] = [];

export function getMusicVolume(): number {
    return musicVolume;
}

export function setMusicVolume(v: number) {
    musicVolume = v;
    if (menuAudio) menuAudio.volume = v;
    if (activeIndex >= 0 && audios[activeIndex]) audios[activeIndex].volume = v;
    for (const fn of volumeListeners) fn(v);
}

export function onVolumeChange(fn: (v: number) => void) {
    volumeListeners.push(fn);
}

// --- Gesture gate ---

let gestureReceived = false;
let pendingMenuPlay = false;

function onFirstGesture() {
    gestureReceived = true;
    window.removeEventListener('pointerdown', onFirstGesture, true);
    window.removeEventListener('keydown', onFirstGesture, true);
    if (pendingMenuPlay && menuAudio) {
        menuAudio.play().catch(() => {});
        pendingMenuPlay = false;
    }
}
window.addEventListener('pointerdown', onFirstGesture, true);
window.addEventListener('keydown', onFirstGesture, true);

// --- Menu music ---

let menuAudio: HTMLAudioElement | null = null;

export function startMenuMusic() {
    stopMenuMusic();
    menuAudio = new Audio(MENU_TRACK);
    menuAudio.loop = true;
    menuAudio.volume = musicVolume;
    if (gestureReceived) {
        menuAudio.play().catch(() => {});
    } else {
        pendingMenuPlay = true;
    }
}

export function stopMenuMusic() {
    if (menuAudio) {
        menuAudio.pause();
        menuAudio.src = '';
        menuAudio = null;
    }
}

// --- Round music ---

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
    const targetVol = musicVolume;

    fadeInterval = setInterval(() => {
        step++;
        const t = step / steps;
        prev.volume = prevStartVol * (1 - t);
        next.volume = targetVol * t;

        if (step >= steps) {
            stopFade();
            prev.pause();
            prev.volume = 0;
            next.volume = targetVol;
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
    audios[0].play().catch(() => {});

    if (menuAudio) {
        const fadingMenu = menuAudio;
        menuAudio = null;
        const steps = CROSSFADE_DURATION * 20;
        let step = 0;
        const menuStartVol = fadingMenu.volume;
        const iv = setInterval(() => {
            step++;
            const t = step / steps;
            fadingMenu.volume = menuStartVol * (1 - t);
            audios[0].volume = musicVolume * t;
            if (step >= steps) {
                clearInterval(iv);
                fadingMenu.pause();
                fadingMenu.src = '';
                audios[0].volume = musicVolume;
            }
        }, CROSSFADE_DURATION * 1000 / steps);
    } else {
        audios[0].volume = musicVolume;
    }

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
