import { NarrationSpeed, SoundId } from '../types';

interface ActiveSoundNode {
  gainNode: GainNode;
  cleanup: () => void;
  targetGain: number;
}

class SleepAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: Map<SoundId, ActiveSoundNode> = new Map();
  private masterVolume = 0.75;
  private fadeMultiplier = 1;

  // Speech narration state
  private narrationActive = false;
  private narrationPaused = false;
  private narrationVolume = 0.75;
  private narrationFadeMultiplier = 1;
  private narrationSpeed: NarrationSpeed = 'slow';
  private narrationVoiceURI = '';
  private currentSentenceTimer: number | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume * this.fadeMultiplier;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createNoiseBuffer(
    ctx: AudioContext,
    type: 'white' | 'pink' | 'brown',
    seconds = 4
  ): AudioBuffer {
    const length = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const output = buffer.getChannelData(ch);
      if (type === 'white') {
        for (let i = 0; i < length; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.45;
        }
      } else if (type === 'pink') {
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
          b6 = white * 0.115926;
        }
      } else {
        // brown noise
        let lastOut = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 1.8;
        }
      }
    }
    return buffer;
  }

  private createSoundGraph(
    ctx: AudioContext,
    id: SoundId,
    destGain: GainNode
  ): () => void {
    const cleanups: Array<() => void> = [];

    const connectNoiseLoop = (
      type: 'white' | 'pink' | 'brown',
      seconds = 4
    ) => {
      const src = ctx.createBufferSource();
      src.buffer = this.createNoiseBuffer(ctx, type, seconds);
      src.loop = true;
      src.start();
      cleanups.push(() => {
        try {
          src.stop();
          src.disconnect();
        } catch {
          // ignore
        }
      });
      return src;
    };

    switch (id) {
      case 'white-noise': {
        const src = connectNoiseLoop('white', 4);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 4200;
        const g = ctx.createGain();
        g.gain.value = 0.25;
        src.connect(lp).connect(g).connect(destGain);
        break;
      }

      case 'pink-noise': {
        const src = connectNoiseLoop('pink', 5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 3200;
        const g = ctx.createGain();
        g.gain.value = 0.55;
        src.connect(lp).connect(g).connect(destGain);
        break;
      }

      case 'brown-noise': {
        const src = connectNoiseLoop('brown', 5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 650;
        const g = ctx.createGain();
        g.gain.value = 0.85;
        src.connect(lp).connect(g).connect(destGain);
        break;
      }

      case 'rainfall': {
        const src = connectNoiseLoop('pink', 5);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1300;
        bp.Q.value = 0.55;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 3800;
        const g = ctx.createGain();
        g.gain.value = 0.6;
        src.connect(bp).connect(lp).connect(g).connect(destGain);

        // Soft gentle droplet layer
        const dropInterval = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const dg = ctx.createGain();
          osc.type = 'sine';
          const baseFreq = 650 + Math.random() * 900;
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.045);
          dg.gain.setValueAtTime(0.0001, now);
          dg.gain.linearRampToValueAtTime(0.014 * Math.random(), now + 0.008);
          dg.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
          osc.connect(dg).connect(destGain);
          osc.start(now);
          osc.stop(now + 0.075);
        }, 160);
        cleanups.push(() => window.clearInterval(dropInterval));
        break;
      }

      case 'ocean': {
        const src = connectNoiseLoop('pink', 6);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 620;

        const waveGain = ctx.createGain();
        waveGain.gain.value = 0.35;

        // Slow surf LFO (~0.11 Hz = ~9s per wave)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.11;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.28;
        lfo.connect(lfoGain).connect(waveGain.gain);

        const filterLfoGain = ctx.createGain();
        filterLfoGain.gain.value = 420;
        lfo.connect(filterLfoGain).connect(lp.frequency);

        lfo.start();
        src.connect(lp).connect(waveGain).connect(destGain);
        cleanups.push(() => {
          try {
            lfo.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'river': {
        const src = connectNoiseLoop('pink', 5);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 780;
        bp.Q.value = 0.7;

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.35;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 180;
        lfo.connect(lfoGain).connect(bp.frequency);
        lfo.start();

        const g = ctx.createGain();
        g.gain.value = 0.65;
        src.connect(bp).connect(g).connect(destGain);
        cleanups.push(() => {
          try {
            lfo.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'wind': {
        const src = connectNoiseLoop('pink', 5);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 340;
        bp.Q.value = 1.8;

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 170;
        lfo.connect(lfoGain).connect(bp.frequency);
        lfo.start();

        const g = ctx.createGain();
        g.gain.value = 0.7;
        src.connect(bp).connect(g).connect(destGain);
        cleanups.push(() => {
          try {
            lfo.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'forest': {
        const src = connectNoiseLoop('pink', 5);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1100;
        bp.Q.value = 0.9;
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.14;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 350;
        lfo.connect(lfoGain).connect(bp.frequency);
        lfo.start();
        const g = ctx.createGain();
        g.gain.value = 0.42;
        src.connect(bp).connect(g).connect(destGain);

        // Occasional distant soft night bird / leaf rustle
        const timer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          if (Math.random() > 0.45) return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const cg = ctx.createGain();
          osc.type = 'sine';
          const freq = 950 + Math.random() * 240;
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.25);
          cg.gain.setValueAtTime(0.0001, now);
          cg.gain.linearRampToValueAtTime(0.012, now + 0.06);
          cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
          osc.connect(cg).connect(destGain);
          osc.start(now);
          osc.stop(now + 0.3);
        }, 3200);

        cleanups.push(() => {
          window.clearInterval(timer);
          try {
            lfo.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'crickets': {
        // Gentle warm low night air + periodic soft cricket pulses
        const air = connectNoiseLoop('brown', 4);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 320;
        const airG = ctx.createGain();
        airG.gain.value = 0.22;
        air.connect(lp).connect(airG).connect(destGain);

        const chirpTimer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          const now = ctx.currentTime;
          const pulses = 3 + Math.floor(Math.random() * 2);
          const baseFreq = 3750 + Math.random() * 240;

          for (let p = 0; p < pulses; p++) {
            const start = now + p * 0.055;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 4200;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, start);
            g.gain.setValueAtTime(0.0001, start);
            g.gain.linearRampToValueAtTime(0.018, start + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.042);

            osc.connect(filter).connect(g).connect(destGain);
            osc.start(start);
            osc.stop(start + 0.05);
          }
        }, 1150);
        cleanups.push(() => window.clearInterval(chirpTimer));
        break;
      }

      case 'fan': {
        const src = connectNoiseLoop('brown', 4);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 440;
        const g = ctx.createGain();
        g.gain.value = 0.72;

        // Subtle fan motor hum
        const hum = ctx.createOscillator();
        hum.type = 'sine';
        hum.frequency.value = 112;
        const humG = ctx.createGain();
        humG.gain.value = 0.03;

        src.connect(lp).connect(g).connect(destGain);
        hum.connect(humG).connect(destGain);
        hum.start();
        cleanups.push(() => {
          try {
            hum.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'ac': {
        const src = connectNoiseLoop('pink', 4);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 380;
        bp.Q.value = 0.6;
        const g = ctx.createGain();
        g.gain.value = 0.55;

        const hum = ctx.createOscillator();
        hum.type = 'triangle';
        hum.frequency.value = 60;
        const humLp = ctx.createBiquadFilter();
        humLp.type = 'lowpass';
        humLp.frequency.value = 120;
        const humG = ctx.createGain();
        humG.gain.value = 0.055;

        src.connect(bp).connect(g).connect(destGain);
        hum.connect(humLp).connect(humG).connect(destGain);
        hum.start();
        cleanups.push(() => {
          try {
            hum.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'fireplace': {
        const rumble = connectNoiseLoop('brown', 5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 280;
        const rg = ctx.createGain();
        rg.gain.value = 0.65;
        rumble.connect(lp).connect(rg).connect(destGain);

        const crackleTimer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          if (Math.random() > 0.6) return;
          const now = ctx.currentTime;
          const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.025), ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
          }
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 1400 + Math.random() * 1800;
          bp.Q.value = 2.0;
          const cg = ctx.createGain();
          cg.gain.value = 0.08 + Math.random() * 0.1;
          src.connect(bp).connect(cg).connect(destGain);
          src.start(now);
        }, 180);
        cleanups.push(() => window.clearInterval(crackleTimer));
        break;
      }

      case 'clock': {
        let isTick = true;
        const tickTimer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(isTick ? 920 : 760, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.028);
          filter.type = 'lowpass';
          filter.frequency.value = 1400;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.linearRampToValueAtTime(0.085, now + 0.003);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
          osc.connect(filter).connect(g).connect(destGain);
          osc.start(now);
          osc.stop(now + 0.04);
          isTick = !isTick;
        }, 1000);
        cleanups.push(() => window.clearInterval(tickTimer));
        break;
      }

      case 'room': {
        const src = connectNoiseLoop('brown', 5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 220;
        const g = ctx.createGain();
        g.gain.value = 0.55;
        src.connect(lp).connect(g).connect(destGain);
        break;
      }
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }

  public syncSounds(
    activeSounds: SoundId[],
    volumes: Partial<Record<SoundId, number>>,
    masterVolume: number
  ) {
    this.masterVolume = masterVolume;
    if (activeSounds.length === 0 && this.activeNodes.size === 0) {
      return;
    }

    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.masterVolume * this.fadeMultiplier,
        now,
        0.15
      );
    }

    // Stop sounds no longer active
    for (const [id, node] of this.activeNodes.entries()) {
      if (!activeSounds.includes(id)) {
        node.gainNode.gain.setTargetAtTime(0.0001, now, 0.25);
        const cleanupFn = node.cleanup;
        const gNode = node.gainNode;
        this.activeNodes.delete(id);
        window.setTimeout(() => {
          cleanupFn();
          try {
            gNode.disconnect();
          } catch {
            // ignore
          }
        }, 900);
      }
    }

    // Start or update active sounds
    for (const id of activeSounds) {
      const vol = Math.max(0, Math.min(1, volumes[id] ?? 0.5));
      const existing = this.activeNodes.get(id);
      if (existing) {
        existing.targetGain = vol;
        existing.gainNode.gain.setTargetAtTime(vol, now, 0.15);
      } else {
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.connect(this.masterGain!);
        const cleanup = this.createSoundGraph(ctx, id, gainNode);
        gainNode.gain.setTargetAtTime(vol, now, 0.35);
        this.activeNodes.set(id, { gainNode, cleanup, targetGain: vol });
      }
    }
  }

  public setFadeMultiplier(multiplier: number) {
    this.fadeMultiplier = Math.max(0, Math.min(1, multiplier));
    this.narrationFadeMultiplier = this.fadeMultiplier;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.masterVolume * this.fadeMultiplier,
        this.ctx.currentTime,
        0.2
      );
    }
  }

  public stopAllSounds() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const [id, node] of this.activeNodes.entries()) {
      node.gainNode.gain.setTargetAtTime(0.0001, now, 0.2);
      const cleanupFn = node.cleanup;
      const gNode = node.gainNode;
      this.activeNodes.delete(id);
      window.setTimeout(() => {
        cleanupFn();
        try {
          gNode.disconnect();
        } catch {
          // ignore
        }
      }, 700);
    }
  }

  public playGentleChime(frequency = 396) {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
      osc.connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.9);
    } catch {
      // AudioContext might require user gesture
    }
  }

  // --- Text-to-Speech Narration ---

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }
    const voices = window.speechSynthesis.getVoices();
    return voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  }

  public speakSinglePhrase(
    text: string,
    options?: {
      voiceURI?: string;
      speed?: NarrationSpeed;
      volume?: number;
    }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const speed = options?.speed ?? this.narrationSpeed;
      utter.rate =
        speed === 'extra-slow' ? 0.68 : speed === 'slow' ? 0.8 : 0.92;
      utter.pitch = 0.88;
      utter.volume = Math.max(
        0,
        Math.min(
          1,
          (options?.volume ?? this.narrationVolume) * this.narrationFadeMultiplier
        )
      );
      const voices = window.speechSynthesis.getVoices();
      const chosen = voices.find(
        (v) => v.voiceURI === (options?.voiceURI || this.narrationVoiceURI)
      );
      if (chosen) utter.voice = chosen;
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore speech synthesis errors
    }
  }

  public startSentenceNarration(
    sentences: string[],
    startIndex: number,
    config: {
      voiceURI: string;
      speed: NarrationSpeed;
      volume: number;
      onSentenceChange: (index: number) => void;
      onComplete: () => void;
    }
  ) {
    this.stopNarration();
    this.narrationActive = true;
    this.narrationPaused = false;
    this.narrationVoiceURI = config.voiceURI;
    this.narrationSpeed = config.speed;
    this.narrationVolume = config.volume;

    const speakNext = (idx: number) => {
      if (!this.narrationActive || this.narrationPaused) return;
      if (idx >= sentences.length) {
        this.narrationActive = false;
        config.onComplete();
        return;
      }

      config.onSentenceChange(idx);

      if (typeof window === 'undefined' || !window.speechSynthesis) {
        // Fallback timed progression if SpeechSynthesis is unavailable
        this.currentSentenceTimer = window.setTimeout(() => {
          speakNext(idx + 1);
        }, 4200);
        return;
      }

      const utter = new SpeechSynthesisUtterance(sentences[idx]);
      utter.rate =
        this.narrationSpeed === 'extra-slow'
          ? 0.68
          : this.narrationSpeed === 'slow'
          ? 0.82
          : 0.94;
      utter.pitch = 0.88;
      utter.volume = Math.max(
        0,
        Math.min(1, this.narrationVolume * this.narrationFadeMultiplier)
      );

      const voices = window.speechSynthesis.getVoices();
      const chosen = voices.find((v) => v.voiceURI === this.narrationVoiceURI);
      if (chosen) utter.voice = chosen;

      let settled = false;
      utter.onend = () => {
        if (settled) return;
        settled = true;
        if (this.narrationActive && !this.narrationPaused) {
          this.currentSentenceTimer = window.setTimeout(() => {
            speakNext(idx + 1);
          }, 650);
        }
      };

      utter.onerror = () => {
        if (settled) return;
        settled = true;
        if (this.narrationActive && !this.narrationPaused) {
          this.currentSentenceTimer = window.setTimeout(() => {
            speakNext(idx + 1);
          }, 3600);
        }
      };

      try {
        window.speechSynthesis.speak(utter);
      } catch {
        this.currentSentenceTimer = window.setTimeout(() => {
          speakNext(idx + 1);
        }, 3800);
      }
    };

    speakNext(startIndex);
  }

  public updateNarrationConfig(
    voiceURI: string,
    speed: NarrationSpeed,
    volume: number
  ) {
    this.narrationVoiceURI = voiceURI;
    this.narrationSpeed = speed;
    this.narrationVolume = volume;
  }

  public stopNarration() {
    this.narrationActive = false;
    this.narrationPaused = false;
    if (this.currentSentenceTimer !== null) {
      window.clearTimeout(this.currentSentenceTimer);
      this.currentSentenceTimer = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }
}

export const sleepAudio = new SleepAudioEngine();
