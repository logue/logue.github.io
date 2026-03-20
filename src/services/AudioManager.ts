export class AudioManager {
  private readonly ctx: AudioContext;
  private source?: AudioBufferSourceNode;
  private readonly analyser: AnalyserNode;

  constructor() {
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
  }

  public async init(url: string) {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    this.source = this.ctx.createBufferSource();
    this.source.buffer = audioBuffer;
    this.source.loop = true; // ogg(loop) なのでシームレスに回る

    this.source.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public start() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.source?.start(0);
  }

  // ビート（キック）の強さを取得してグリッチに回す
  public getBeatIntensity() {
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    // 低域（0-10付近）の平均を取る
    const lowFreq = data.slice(0, 10).reduce((a, b) => a + b) / 10;
    return lowFreq / 255; // 0.0 ~ 1.0
  }
}
