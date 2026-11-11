/**
 * Synthetic ECG and plethysmograph traces for the demo monitor.
 * Shapes are illustrative only and are driven by the simulated heart rate.
 */
const g = (x: number, mu: number, w: number) => Math.exp(-0.5 * ((x - mu) / w) ** 2);

export class EcgSynth {
  private hr: number;
  private target: number;
  private t = 0;
  private n = 0;

  constructor(hr: number) {
    this.hr = hr;
    this.target = hr;
  }

  setRate(hr: number) {
    this.target = hr;
  }

  next(dt: number): number {
    this.hr += (this.target - this.hr) * Math.min(1, dt * 0.8);
    const period = 60 / Math.max(30, this.hr);
    this.t += dt;
    if (this.t >= period) this.t -= period;
    const x = this.t;
    this.n = 0.9 * this.n + 0.1 * (Math.random() * 2 - 1);
    return (
      0.12 * g(x, 0.06, 0.022) -
      0.1 * g(x, 0.14, 0.008) +
      1.0 * g(x, 0.16, 0.009) -
      0.22 * g(x, 0.182, 0.009) +
      0.26 * g(x, 0.34, 0.04) +
      0.06 * this.n
    );
  }
}

export class PlethSynth {
  private hr: number;
  private target: number;
  private phase = 0;
  private amp: number;
  private targetAmp: number;
  private artefact = 0;
  private n = 0;

  constructor(hr: number, amplitude: number) {
    this.hr = hr;
    this.target = hr;
    this.amp = amplitude;
    this.targetAmp = amplitude;
  }

  setRate(hr: number) {
    this.target = hr;
  }

  setSignal(amplitude: number, artefact: number) {
    this.targetAmp = amplitude;
    this.artefact = artefact;
  }

  next(dt: number): number {
    const k = Math.min(1, dt * 0.8);
    this.hr += (this.target - this.hr) * k;
    this.amp += (this.targetAmp - this.amp) * k;
    this.phase += (dt * this.hr) / 60;
    if (this.phase >= 1) this.phase -= 1;
    const p = this.phase;
    this.n = 0.96 * this.n + 0.04 * (Math.random() * 2 - 1);
    const pulse = g(p, 0.22, 0.09) + 0.38 * g(p, 0.52, 0.08) + 0.15 * g(p, 1.22, 0.09);
    return this.amp * pulse + this.artefact * this.n * 4;
  }
}
