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
      seconds = 5
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

    const createPanner = (panVal: number): AudioNode => {
      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, panVal));
        return panner;
      }
      const fallback = ctx.createGain();
      return fallback;
    };

    switch (id) {
      case 'white-noise': {
        // Crisp, bright full-spectrum acoustic blanket
        const src = connectNoiseLoop('white', 4);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 180;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 8500;
        const g = ctx.createGain();
        g.gain.value = 0.24;
        src.connect(hp).connect(lp).connect(g).connect(destGain);
        break;
      }

      case 'pink-noise': {
        // Balanced, natural mid-warm noise
        const src = connectNoiseLoop('pink', 5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 3400;
        const g = ctx.createGain();
        g.gain.value = 0.65;
        src.connect(lp).connect(g).connect(destGain);
        break;
      }

      case 'brown-noise': {
        // Deep, heavy sub-bass rumble
        const src = connectNoiseLoop('brown', 5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 260;
        const shelf = ctx.createBiquadFilter();
        shelf.type = 'lowshelf';
        shelf.frequency.value = 120;
        shelf.gain.value = 6;
        const g = ctx.createGain();
        g.gain.value = 1.05;
        src.connect(lp).connect(shelf).connect(g).connect(destGain);
        break;
      }

      case 'rainfall': {
        // Light airy rain sheet + distinct pattering individual raindrops
        const src = connectNoiseLoop('white', 5);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 950;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 5200;
        const sheetGain = ctx.createGain();
        sheetGain.gain.value = 0.14;
        src.connect(hp).connect(lp).connect(sheetGain).connect(destGain);

        // Pre-built short impulse buffer for realistic water droplet taps
        const dropBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
        const dropData = dropBuf.getChannelData(0);
        for (let i = 0; i < dropData.length; i++) {
          dropData[i] =
            (Math.random() * 2 - 1) * Math.exp(-i / (dropData.length * 0.16));
        }

        const dropTimer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          const count = 1 + (Math.random() > 0.45 ? 1 : 0);
          for (let d = 0; d < count; d++) {
            const delay = Math.random() * 0.055;
            const now = ctx.currentTime + delay;

            const tap = ctx.createBufferSource();
            tap.buffer = dropBuf;
            const bp = ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 1200 + Math.random() * 2800;
            bp.Q.value = 3.2;

            const dg = ctx.createGain();
            dg.gain.value = 0.12 + Math.random() * 0.18;

            const pan = createPanner((Math.random() * 2 - 1) * 0.8);
            tap.connect(bp).connect(dg).connect(pan).connect(destGain);
            tap.start(now);

            // Occasional soft puddle plink
            if (Math.random() < 0.22) {
              const osc = ctx.createOscillator();
              const pg = ctx.createGain();
              const f0 = 480 + Math.random() * 520;
              osc.type = 'sine';
              osc.frequency.setValueAtTime(f0, now);
              osc.frequency.exponentialRampToValueAtTime(f0 * 1.45, now + 0.04);
              pg.gain.setValueAtTime(0.0001, now);
              pg.gain.linearRampToValueAtTime(0.045, now + 0.006);
              pg.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
              osc.connect(pg).connect(pan);
              osc.start(now);
              osc.stop(now + 0.06);
            }
          }
        }, 65);
        cleanups.push(() => window.clearInterval(dropTimer));
        break;
      }

      case 'ocean': {
        // Clear 10-second surf cycle: quiet trough -> deep wave crash -> receding bright foam
        const deepSrc = connectNoiseLoop('brown', 6);
        const deepLp = ctx.createBiquadFilter();
        deepLp.type = 'lowpass';
        deepLp.frequency.value = 220;

        const foamSrc = connectNoiseLoop('pink', 6);
        const foamBp = ctx.createBiquadFilter();
        foamBp.type = 'bandpass';
        foamBp.frequency.value = 1500;
        foamBp.Q.value = 0.7;

        const deepGain = ctx.createGain();
        deepGain.gain.value = 0.08;
        const foamGain = ctx.createGain();
        foamGain.gain.value = 0.02;

        deepSrc.connect(deepLp).connect(deepGain).connect(destGain);
        foamSrc.connect(foamBp).connect(foamGain).connect(destGain);

        const cycleSeconds = 9.5;
        const scheduleWave = () => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          const now = ctx.currentTime;
          // Deep swell rises, crests, and subsides
          deepGain.gain.cancelScheduledValues(now);
          deepGain.gain.setValueAtTime(0.06, now);
          deepGain.gain.linearRampToValueAtTime(0.85, now + 3.8);
          deepGain.gain.exponentialRampToValueAtTime(0.07, now + 8.8);

          deepLp.frequency.cancelScheduledValues(now);
          deepLp.frequency.setValueAtTime(140, now);
          deepLp.frequency.linearRampToValueAtTime(520, now + 4.0);
          deepLp.frequency.exponentialRampToValueAtTime(140, now + 8.8);

          // Seafoam hiss peaks slightly after wave crest as water rushes up shore
          foamGain.gain.cancelScheduledValues(now);
          foamGain.gain.setValueAtTime(0.015, now);
          foamGain.gain.linearRampToValueAtTime(0.04, now + 2.6);
          foamGain.gain.linearRampToValueAtTime(0.38, now + 4.5);
          foamGain.gain.exponentialRampToValueAtTime(0.02, now + 9.0);
        };

        scheduleWave();
        const waveTimer = window.setInterval(scheduleWave, cycleSeconds * 1000);
        cleanups.push(() => window.clearInterval(waveTimer));
        break;
      }

      case 'river': {
        // Lively babbling brook: steady mid-stream + multi-band rapid pebble turbulence + water bloops
        const streamSrc = connectNoiseLoop('pink', 5);
        const streamBp = ctx.createBiquadFilter();
        streamBp.type = 'bandpass';
        streamBp.frequency.value = 620;
        streamBp.Q.value = 0.85;
        const streamG = ctx.createGain();
        streamG.gain.value = 0.42;
        streamSrc.connect(streamBp).connect(streamG).connect(destGain);

        // Two faster modulated babble resonators
        const babble1 = connectNoiseLoop('white', 4);
        const bbp1 = ctx.createBiquadFilter();
        bbp1.type = 'bandpass';
        bbp1.frequency.value = 1350;
        bbp1.Q.value = 4.0;
        const lfo1 = ctx.createOscillator();
        lfo1.frequency.value = 2.1;
        const lfo1G = ctx.createGain();
        lfo1G.gain.value = 420;
        lfo1.connect(lfo1G).connect(bbp1.frequency);
        lfo1.start();
        const bg1 = ctx.createGain();
        bg1.gain.value = 0.16;
        babble1.connect(bbp1).connect(bg1).connect(destGain);

        const babble2 = connectNoiseLoop('pink', 4);
        const bbp2 = ctx.createBiquadFilter();
        bbp2.type = 'bandpass';
        bbp2.frequency.value = 2100;
        bbp2.Q.value = 4.5;
        const lfo2 = ctx.createOscillator();
        lfo2.frequency.value = 3.4;
        const lfo2G = ctx.createGain();
        lfo2G.gain.value = 500;
        lfo2.connect(lfo2G).connect(bbp2.frequency);
        lfo2.start();
        const bg2 = ctx.createGain();
        bg2.gain.value = 0.15;
        babble2.connect(bbp2).connect(bg2).connect(destGain);

        // Soft bubbly stone-stream gurgles
        const bubbleTimer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          if (Math.random() > 0.72) return;
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const bg = ctx.createGain();
          const startFreq = 260 + Math.random() * 360;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(startFreq, now);
          osc.frequency.exponentialRampToValueAtTime(startFreq * 1.75, now + 0.065);
          bg.gain.setValueAtTime(0.0001, now);
          bg.gain.linearRampToValueAtTime(0.05, now + 0.015);
          bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
          const pan = createPanner((Math.random() * 2 - 1) * 0.65);
          osc.connect(bg).connect(pan).connect(destGain);
          osc.start(now);
          osc.stop(now + 0.085);
        }, 125);

        cleanups.push(() => {
          window.clearInterval(bubbleTimer);
          try {
            lfo1.stop();
            lfo2.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'wind': {
        // Resonant sweeping nocturnal wind gusts with sighing pitch contour
        const src = connectNoiseLoop('pink', 5);

        const bp1 = ctx.createBiquadFilter();
        bp1.type = 'bandpass';
        bp1.frequency.value = 340;
        bp1.Q.value = 5.2;

        const bp2 = ctx.createBiquadFilter();
        bp2.type = 'bandpass';
        bp2.frequency.value = 560;
        bp2.Q.value = 4.0;

        const g1 = ctx.createGain();
        g1.gain.value = 0.55;
        const g2 = ctx.createGain();
        g2.gain.value = 0.35;

        const lfo1 = ctx.createOscillator();
        lfo1.type = 'sine';
        lfo1.frequency.value = 0.075;
        const lfo1Freq = ctx.createGain();
        lfo1Freq.gain.value = 185;
        const lfo1Amp = ctx.createGain();
        lfo1Amp.gain.value = 0.32;
        lfo1.connect(lfo1Freq).connect(bp1.frequency);
        lfo1.connect(lfo1Amp).connect(g1.gain);

        const lfo2 = ctx.createOscillator();
        lfo2.type = 'sine';
        lfo2.frequency.value = 0.11;
        const lfo2Freq = ctx.createGain();
        lfo2Freq.gain.value = 240;
        const lfo2Amp = ctx.createGain();
        lfo2Amp.gain.value = 0.22;
        lfo2.connect(lfo2Freq).connect(bp2.frequency);
        lfo2.connect(lfo2Amp).connect(g2.gain);

        lfo1.start();
        lfo2.start();
        src.connect(bp1).connect(g1).connect(destGain);
        src.connect(bp2).connect(g2).connect(destGain);

        cleanups.push(() => {
          try {
            lfo1.stop();
            lfo2.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'forest': {
        // Quiet canopy breeze + rhythmic leaf-rustle swells + distant night owl hoots
        const canopySrc = connectNoiseLoop('pink', 5);
        const canopyBp = ctx.createBiquadFilter();
        canopyBp.type = 'bandpass';
        canopyBp.frequency.value = 480;
        canopyBp.Q.value = 1.4;
        const canopyG = ctx.createGain();
        canopyG.gain.value = 0.14;
        canopySrc.connect(canopyBp).connect(canopyG).connect(destGain);

        // Leaf rustle bursts (high-mid stereo-panned swells)
        const rustleTimer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          if (Math.random() > 0.7) return;
          const now = ctx.currentTime;
          const dur = 0.7 + Math.random() * 0.9;
          const rSrc = ctx.createBufferSource();
          rSrc.buffer = this.createNoiseBuffer(ctx, 'white', 2);
          const hp = ctx.createBiquadFilter();
          hp.type = 'bandpass';
          hp.frequency.value = 2400 + Math.random() * 1400;
          hp.Q.value = 1.6;
          const rg = ctx.createGain();
          rg.gain.setValueAtTime(0.0001, now);
          rg.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.06, now + dur * 0.45);
          rg.gain.exponentialRampToValueAtTime(0.0001, now + dur);
          const pan = createPanner((Math.random() * 2 - 1) * 0.85);
          rSrc.connect(hp).connect(rg).connect(pan).connect(destGain);
          rSrc.start(now);
          rSrc.stop(now + dur + 0.05);
        }, 1600);

        // Distant soft owl hoot ("hoo... hoo-hoo")
        const owlTimer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          if (Math.random() > 0.65) return;
          const now = ctx.currentTime;
          const pan = createPanner((Math.random() * 2 - 1) * 0.6);
          pan.connect(destGain);

          const hootNotes = [
            { offset: 0, dur: 0.48, freq: 392 },
            { offset: 0.85, dur: 0.28, freq: 370 },
            { offset: 1.25, dur: 0.65, freq: 349 },
          ];
          for (const note of hootNotes) {
            const t = now + note.offset;
            const osc = ctx.createOscillator();
            const lp = ctx.createBiquadFilter();
            const og = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.freq, t);
            osc.frequency.exponentialRampToValueAtTime(note.freq * 0.96, t + note.dur);
            lp.type = 'lowpass';
            lp.frequency.value = 650;
            og.gain.setValueAtTime(0.0001, t);
            og.gain.linearRampToValueAtTime(0.065, t + 0.09);
            og.gain.exponentialRampToValueAtTime(0.0001, t + note.dur);
            osc.connect(lp).connect(og).connect(pan);
            osc.start(t);
            osc.stop(t + note.dur + 0.05);
          }
        }, 5800);

        cleanups.push(() => {
          window.clearInterval(rustleTimer);
          window.clearInterval(owlTimer);
        });
        break;
      }

      case 'crickets': {
        // Clear nocturnal cricket chorus with minimal background floor
        const air = connectNoiseLoop('brown', 4);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 170;
        const airG = ctx.createGain();
        airG.gain.value = 0.07;
        air.connect(lp).connect(airG).connect(destGain);

        const scheduleCricketChirp = (panVal: number, baseFreq: number) => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          const now = ctx.currentTime;
          const pulses = 4;
          const pan = createPanner(panVal);
          pan.connect(destGain);

          for (let p = 0; p < pulses; p++) {
            const start = now + p * 0.052;
            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const g = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = baseFreq;
            filter.Q.value = 6;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq, start);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(baseFreq * 1.015, start);

            g.gain.setValueAtTime(0.0001, start);
            g.gain.linearRampToValueAtTime(0.055, start + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.042);

            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(g).connect(pan);
            osc.start(start);
            osc2.start(start);
            osc.stop(start + 0.048);
            osc2.stop(start + 0.048);
          }
        };

        const chirpLeft = window.setInterval(
          () => scheduleCricketChirp(-0.45, 3850 + Math.random() * 80),
          980
        );
        const chirpRight = window.setInterval(
          () => scheduleCricketChirp(0.5, 4220 + Math.random() * 90),
          1340
        );

        cleanups.push(() => {
          window.clearInterval(chirpLeft);
          window.clearInterval(chirpRight);
        });
        break;
      }

      case 'fan': {
        // Mechanical blade flutter (~13Hz AM) + warm motor hum
        const src = connectNoiseLoop('brown', 4);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 540;
        const bp = ctx.createBiquadFilter();
        bp.type = 'peaking';
        bp.frequency.value = 230;
        bp.gain.value = 5;

        const bladeGain = ctx.createGain();
        bladeGain.gain.value = 0.72;

        const bladeLfo = ctx.createOscillator();
        bladeLfo.type = 'sine';
        bladeLfo.frequency.value = 12.5;
        const bladeDepth = ctx.createGain();
        bladeDepth.gain.value = 0.14;
        bladeLfo.connect(bladeDepth).connect(bladeGain.gain);
        bladeLfo.start();

        // Fan motor drone
        const hum = ctx.createOscillator();
        hum.type = 'sine';
        hum.frequency.value = 108;
        const humG = ctx.createGain();
        humG.gain.value = 0.075;

        src.connect(lp).connect(bp).connect(bladeGain).connect(destGain);
        hum.connect(humG).connect(destGain);
        hum.start();
        cleanups.push(() => {
          try {
            hum.stop();
            bladeLfo.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'ac': {
        // Steady indoor cooling: 60Hz/120Hz compressor hum + flat duct vent rush
        const src = connectNoiseLoop('pink', 4);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 680;
        bp.Q.value = 0.9;
        const g = ctx.createGain();
        g.gain.value = 0.45;

        const hum1 = ctx.createOscillator();
        hum1.type = 'sine';
        hum1.frequency.value = 60;
        const hum2 = ctx.createOscillator();
        hum2.type = 'triangle';
        hum2.frequency.value = 120;
        const humLp = ctx.createBiquadFilter();
        humLp.type = 'lowpass';
        humLp.frequency.value = 220;
        const humG = ctx.createGain();
        humG.gain.value = 0.11;

        src.connect(bp).connect(g).connect(destGain);
        hum1.connect(humLp);
        hum2.connect(humLp);
        humLp.connect(humG).connect(destGain);
        hum1.start();
        hum2.start();
        cleanups.push(() => {
          try {
            hum1.stop();
            hum2.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'fireplace': {
        // Deep hearth flame flicker + frequent crisp wood crackles and pops
        const rumble = connectNoiseLoop('brown', 5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 240;
        const rg = ctx.createGain();
        rg.gain.value = 0.45;

        const flickerLfo = ctx.createOscillator();
        flickerLfo.type = 'sine';
        flickerLfo.frequency.value = 0.85;
        const flickerDepth = ctx.createGain();
        flickerDepth.gain.value = 0.18;
        flickerLfo.connect(flickerDepth).connect(rg.gain);
        flickerLfo.start();
        rumble.connect(lp).connect(rg).connect(destGain);

        const crackleBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.022), ctx.sampleRate);
        const cData = crackleBuf.getChannelData(0);
        for (let i = 0; i < cData.length; i++) {
          cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (cData.length * 0.14));
        }

        const crackleTimer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          if (Math.random() > 0.78) return;
          const now = ctx.currentTime + Math.random() * 0.04;
          const src = ctx.createBufferSource();
          src.buffer = crackleBuf;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 1100 + Math.random() * 2900;
          bp.Q.value = 1.6;
          const cg = ctx.createGain();
          cg.gain.value = 0.2 + Math.random() * 0.28;
          const pan = createPanner((Math.random() * 2 - 1) * 0.4);
          src.connect(bp).connect(cg).connect(pan).connect(destGain);
          src.start(now);
        }, 130);

        cleanups.push(() => {
          window.clearInterval(crackleTimer);
          try {
            flickerLfo.stop();
          } catch {
            // ignore
          }
        });
        break;
      }

      case 'clock': {
        // Pure bedside wooden escapement tick-tock once per second (no noise floor)
        let isTick = true;
        const tickTimer = window.setInterval(() => {
          if (!this.ctx || this.ctx.state !== 'running') return;
          const now = ctx.currentTime;

          // Primary crisp wooden click
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(isTick ? 1450 : 1120, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.022);
          filter.type = 'bandpass';
          filter.frequency.value = isTick ? 1100 : 880;
          filter.Q.value = 1.8;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.linearRampToValueAtTime(isTick ? 0.24 : 0.19, now + 0.002);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);
          osc.connect(filter).connect(g).connect(destGain);
          osc.start(now);
          osc.stop(now + 0.04);

          // Hollow wooden body thump
          const bodyOsc = ctx.createOscillator();
          const bg = ctx.createGain();
          bodyOsc.type = 'sine';
          bodyOsc.frequency.setValueAtTime(isTick ? 360 : 300, now);
          bodyOsc.frequency.exponentialRampToValueAtTime(120, now + 0.025);
          bg.gain.setValueAtTime(0.0001, now);
          bg.gain.linearRampToValueAtTime(0.12, now + 0.002);
          bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
          bodyOsc.connect(bg).connect(destGain);
          bodyOsc.start(now);
          bodyOsc.stop(now + 0.035);

          isTick = !isTick;
        }, 1000);
        cleanups.push(() => window.clearInterval(tickTimer));
        break;
      }

      case 'room': {
        // Ultra-quiet enclosed indoor stillness (subtle muffled room tone)
        const src = connectNoiseLoop('brown', 5);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 145;
        const g = ctx.createGain();
        g.gain.value = 0.28;

        const hum = ctx.createOscillator();
        hum.type = 'sine';
        hum.frequency.value = 50;
        const hg = ctx.createGain();
        hg.gain.value = 0.016;

        src.connect(lp).connect(g).connect(destGain);
        hum.connect(hg).connect(destGain);
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
