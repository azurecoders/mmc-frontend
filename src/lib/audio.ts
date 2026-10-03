/**
 * Web Audio API synthesizer for clean hospital audio alerts.
 * Works completely in-browser without needing external MP3/WAV files.
 */

class HospitalAudioPlayer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Hospital Chime ("Ding-Dong" 2-tone pleasant alert)
   * Played when a patient token is called.
   */
  playTokenCalledChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1: High note (E5 ~ 659 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2: Lower harmonious note (C5 ~ 523 Hz) starting after 300ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(523.25, now + 0.3);
      gain2.gain.setValueAtTime(0.3, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.3);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn("Audio playback error:", e);
    }
  }

  /**
   * Emergency Pulsing Siren
   * Played for critical triage MEWS alerts / priority patient escalation.
   */
  playEmergencyAlarm() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const startTime = now + i * 0.35;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, startTime); // A5
        osc.frequency.linearRampToValueAtTime(1100, startTime + 0.15);
        osc.frequency.linearRampToValueAtTime(880, startTime + 0.3);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio alarm playback error:", e);
    }
  }
}

export const hospitalAudio = new HospitalAudioPlayer();
