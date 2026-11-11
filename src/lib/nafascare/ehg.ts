/**
 * Synthetic EHG (electrohysterogram) generator for demonstration only.
 * Produces Gaussian-enveloped oscillatory bursts on a noisy baseline.
 * Output is fictional and carries no diagnostic meaning.
 */
export interface EhgParams {
  /** Relative burst amplitude (1 ≈ 1 mV-sim peak) */
  amplitude: number;
  /** Mean seconds between bursts (demo time-compressed) */
  period: number;
  /** 0–1 variation applied to the burst interval */
  irregularity: number;
  /** Baseline noise level */
  noise: number;
  /** Burst envelope width (seconds, Gaussian sigma) */
  width: number;
}

const KEYS: (keyof EhgParams)[] = ["amplitude", "period", "irregularity", "noise", "width"];
const TAU = Math.PI * 2;

interface Burst {
  center: number;
  amp: number;
  phase: number;
}

export class EhgSynth {
  private t = 0;
  private p: EhgParams;
  private target: EhgParams;
  private bursts: Burst[] = [];
  private nextBurst = 1.5;
  private n1 = 0;
  private n2 = 0;

  constructor(params: EhgParams) {
    this.p = { ...params };
    this.target = { ...params };
  }

  setTarget(params: EhgParams) {
    this.target = params;
  }

  next(dt: number): number {
    this.t += dt;
    const k = Math.min(1, dt * 0.6);
    for (const key of KEYS) this.p[key] += (this.target[key] - this.p[key]) * k;

    const { amplitude, period, irregularity, noise, width } = this.p;

    if (this.t >= this.nextBurst) {
      this.bursts.push({
        center: this.t + width * 2.2,
        amp: amplitude * (0.82 + Math.random() * 0.3),
        phase: Math.random() * TAU,
      });
      this.nextBurst = this.t + period * (1 + irregularity * (Math.random() * 2 - 1));
    }
    this.bursts = this.bursts.filter((b) => this.t < b.center + width * 3.5);

    this.n1 = 0.82 * this.n1 + 0.18 * (Math.random() * 2 - 1);
    this.n2 = 0.996 * this.n2 + 0.004 * (Math.random() * 2 - 1);

    let v = 0;
    for (const b of this.bursts) {
      const z = (this.t - b.center) / width;
      const env = Math.exp(-0.5 * z * z);
      v +=
        b.amp *
        env *
        (0.58 * Math.sin(TAU * 1.15 * this.t + b.phase) +
          0.32 * Math.sin(TAU * 2.6 * this.t + b.phase * 1.7) +
          0.9 * this.n1);
    }
    v += noise * 4 * this.n1 + this.n2 * 0.8 + 0.035 * Math.sin(TAU * 0.07 * this.t);
    return v;
  }
}
