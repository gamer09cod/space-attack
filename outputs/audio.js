"use strict";

// Small Web Audio synth: no downloads, audio files, or background timers.
const arcadeAudio = {
  context: null,
  output: null,
  muted: false,
  unavailable: false,
  voices: new Set(),
  nextBeat: 0,
  beat: 0,

  unlock() {
    if (this.unavailable) return;
    try {
      if (!this.context) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) { this.unavailable = true; return; }
        this.context = new AudioContextClass();
        this.output = this.context.createGain();
        this.output.gain.value = this.muted ? 0 : 0.22;
        this.output.connect(this.context.destination);
      }
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
    } catch { this.unavailable = true; }
  },

  tone(frequency, duration, type = "sine", volume = 0.12, endFrequency = frequency, delay = 0) {
    if (this.unavailable || !this.context || !this.output || this.context.state !== "running" || this.muted || this.voices.size >= 24) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const start = this.context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.output);
    this.voices.add(oscillator);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.voices.delete(oscillator);
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  },

  play(name) {
    switch (name) {
      case "fire": this.tone(950, 0.09, "triangle", 0.14, 300); break;
      case "enemyHit":
        this.tone(160, 0.16, "sawtooth", 0.12, 45);
        this.tone(600, 0.1, "triangle", 0.08, 90);
        break;
      case "playerHit": this.tone(240, 0.3, "square", 0.12, 55); break;
      case "wave":
        [220, 330, 440, 660].forEach((note, i) => this.tone(note, 0.16, "triangle", 0.16, note, i * 0.12));
        break;
      case "complete":
        [523, 659, 784].forEach((note, i) => this.tone(note, 0.18, "sine", 0.16, note, i * 0.1));
        break;
      case "gameOver":
        [330, 262, 196, 110].forEach((note, i) => this.tone(note, 0.25, "triangle", 0.16, note, i * 0.18));
        break;
    }
  },

  update(playing) {
    if (!playing || !this.context || this.context.state !== "running" || this.muted) return;
    const now = this.context.currentTime;
    if (now < this.nextBeat) return;
    // Schedule one beat at most per frame; returning to the tab never causes a burst.
    const melody = [330, 0, 392, 440, 0, 392, 294, 0, 330, 392, 494, 440, 392, 0, 294, 0];
    const note = melody[this.beat % melody.length];
    if (note) this.tone(note, 0.17, "triangle", 0.07);
    if (this.beat % 2 === 0) this.tone(this.beat % 16 < 8 ? 82.41 : 73.42, 0.2, "sine", 0.14);
    this.beat++;
    this.nextBeat = now + 0.22;
  },

  reset() {
    for (const voice of this.voices) voice.stop();
    this.voices.clear();
    this.beat = 0;
    this.nextBeat = this.context ? this.context.currentTime + 0.6 : 0;
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.output) this.output.gain.setTargetAtTime(this.muted ? 0 : 0.22, this.context.currentTime, 0.02);
  },

  pause() {
    if (this.context && this.context.state === "running") this.context.suspend().catch(() => {});
  }
};
