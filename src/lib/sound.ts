// Web Audio API harmonic chime & device vibration utility

export const playChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell tone 1: C5 -> E5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Harmonic bell tone 2: G5 chime layer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.35);

    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.12);

    osc1.stop(now + 0.9);
    osc2.stop(now + 1.2);
  } catch (e) {
    console.warn('Audio chime playback not allowed or not supported:', e);
  }
};

export const triggerVibration = (pattern: number[] = [200, 100, 200, 100, 300]) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    console.warn('Vibration not supported or denied:', e);
  }
};
