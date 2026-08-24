const SOUND_KEY = "squadsum:sound";

export function getSavedSound() {
  return localStorage.getItem(SOUND_KEY) !== "off";
}

export function saveSound(enabled) {
  localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
}

function tone(frequency, duration, type = "sine", delay = 0) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(context.currentTime + delay);
  oscillator.stop(context.currentTime + delay + duration + 0.02);
  oscillator.addEventListener("ended", () => context.close(), { once: true });
}

export function playSound(kind, enabled) {
  if (!enabled) return;
  if (kind === "click") tone(240, 0.055, "triangle");
  if (kind === "wrong") tone(145, 0.18, "sawtooth");
  if (kind === "correct") {
    tone(520, 0.13, "triangle");
    tone(760, 0.18, "triangle", 0.1);
  }
}
