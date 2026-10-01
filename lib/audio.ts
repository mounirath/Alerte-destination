/**
 * Alarme sonore via Web Audio API (oscillateur).
 * Déverrouillée par un geste utilisateur (bouton Démarrer).
 */

let audioCtx: AudioContext | null = null;
let loopTimer: ReturnType<typeof setInterval> | null = null;
let vibrateTimer: ReturnType<typeof setInterval> | null = null;
let activeSources: AudioScheduledSourceNode[] = [];

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

/** À appeler sur le tap « Démarrer » pour respecter la politique autoplay. */
export async function unlockAudio(): Promise<void> {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      /* ignore */
    }
  }
}

function beep(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType = 'square'
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
  activeSources.push(osc);
  osc.onended = () => {
    activeSources = activeSources.filter((s) => s !== osc);
  };
}

function playPattern() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  // Double bip aigu + grave, type alarme gare / réveil.
  beep(ctx, 880, t, 0.16);
  beep(ctx, 660, t + 0.2, 0.18);
  beep(ctx, 880, t + 0.48, 0.16);
  beep(ctx, 523, t + 0.7, 0.28, 'triangle');
}

export function startAlarm() {
  stopAlarm();
  playPattern();
  loopTimer = setInterval(playPattern, 1400);
}

export function stopAlarm() {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
  activeSources.forEach((s) => {
    try {
      s.stop();
    } catch {
      /* already stopped */
    }
  });
  activeSources = [];
}

const VIBRATE_PATTERN = [500, 200, 500, 200, 700, 400];

export function startVibrate() {
  stopVibrate();
  const vibrate = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(VIBRATE_PATTERN);
      }
    } catch {
      /* non supporté */
    }
  };
  vibrate();
  vibrateTimer = setInterval(vibrate, 2000);
}

export function stopVibrate() {
  if (vibrateTimer) {
    clearInterval(vibrateTimer);
    vibrateTimer = null;
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(0);
    }
  } catch {
    /* ignore */
  }
}

export function stopAllAlerts() {
  stopAlarm();
  stopVibrate();
}
