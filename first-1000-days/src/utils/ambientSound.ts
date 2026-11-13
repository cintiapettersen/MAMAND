// Sons calmantes gerados no próprio aparelho (Web Audio API).
// Nenhum arquivo de áudio: zero questão de licença, funciona offline e não pesa no app.

export type AmbientSoundType = 'white' | 'pink' | 'brown' | 'rain';

const BUFFER_SECONDS = 8;
const FADE_SECONDS = 1.2;

type AudioContextCtor = typeof AudioContext;

const getAudioContextCtor = (): AudioContextCtor | null => {
  if (typeof window === 'undefined') return null;
  return (window.AudioContext || (window as any).webkitAudioContext || null) as AudioContextCtor | null;
};

export const isAmbientSoundSupported = () => getAudioContextCtor() !== null;

// Preenche um canal com o tipo de ruído pedido
const fillNoise = (data: Float32Array, type: AmbientSoundType, sampleRate: number) => {
  if (type === 'white') {
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
    return;
  }

  if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return;
  }

  // Ruído rosa (filtro de Paul Kellet), base também da chuva
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
    b6 = white * 0.115926;
  }

  if (type === 'rain') {
    // Gotinhas esparsas por cima do ruído rosa
    const drops = Math.floor((data.length / sampleRate) * 90);
    for (let d = 0; d < drops; d++) {
      const start = Math.floor(Math.random() * data.length);
      const amp = 0.08 + Math.random() * 0.18;
      const length = Math.floor(sampleRate * (0.004 + Math.random() * 0.01));
      for (let i = 0; i < length && start + i < data.length; i++) {
        data[start + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / (length / 4));
      }
    }
  }
};

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private volume = 0.6;

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  play(type: AmbientSoundType) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.stop(0.3);

    const buffer = ctx.createBuffer(2, ctx.sampleRate * BUFFER_SECONDS, ctx.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      fillNoise(buffer.getChannelData(ch), type, ctx.sampleRate);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + FADE_SECONDS);

    // Chuva soa mais natural sem os graves e agudos extremos
    if (type === 'rain') {
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 5200;
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 280;
      source.connect(highpass).connect(lowpass).connect(gain);
    } else {
      source.connect(gain);
    }
    gain.connect(ctx.destination);
    source.start();

    this.source = source;
    this.gain = gain;
  }

  stop(fadeSeconds = FADE_SECONDS) {
    if (!this.ctx || !this.source || !this.gain) return;
    const { source, gain } = this;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
    source.stop(now + fadeSeconds + 0.05);
    this.source = null;
    this.gain = null;
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.ctx && this.gain) {
      this.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  // Sininho suave de três notas para o fim do descanso
  chime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.45;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.7);
    });
  }
}

export const ambientSound = new AmbientSoundEngine();
