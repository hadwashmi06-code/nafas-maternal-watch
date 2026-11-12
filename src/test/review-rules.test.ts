import { describe, expect, it } from "vitest";

import { evaluateReview, shockIndex } from "@/lib/nafascare/review-rules";
import { SCENARIOS } from "@/lib/nafascare/scenarios";

const fromScenario = (id: keyof typeof SCENARIOS) => {
  const s = SCENARIOS[id];
  return {
    hr: s.vitals.hr,
    sys: s.vitals.sys,
    spo2: s.vitals.spo2,
    rr: s.vitals.rr,
    temp: s.vitals.temp,
    ebl: s.eblPreset,
  };
};
const stable = fromScenario("stable");
const levelOf = (input: Parameters<typeof evaluateReview>[0], param: string) =>
  evaluateReview(input).reasons.find((r) => r.param === param)?.level ?? "none";

describe("demo review prompts", () => {
  it("Stable scenario raises no review prompt", () => {
    expect(evaluateReview(stable).level).toBe("none");
  });

  it("Clinical Review scenario raises a clinical review prompt", () => {
    expect(evaluateReview(fromScenario("review")).level).toBe("review");
  });

  it("Urgent Review scenario raises an urgent review prompt", () => {
    expect(evaluateReview(fromScenario("urgent")).level).toBe("urgent");
  });

  it("recorded blood loss of 500 mL raises a review prompt on otherwise stable values", () => {
    expect(evaluateReview({ ...stable, ebl: 500 }).level).toBe("review");
  });

  it("respiratory rate 21 suggests review and 25 suggests urgent review", () => {
    expect(levelOf({ ...stable, rr: 20 }, "rr")).toBe("none");
    expect(levelOf({ ...stable, rr: 21 }, "rr")).toBe("review");
    expect(levelOf({ ...stable, rr: 25 }, "rr")).toBe("urgent");
  });

  it("temperature 38.0 °C suggests review and 39.0 °C suggests urgent review", () => {
    expect(levelOf({ ...stable, temp: 37.9 }, "temp")).toBe("none");
    expect(levelOf({ ...stable, temp: 38 }, "temp")).toBe("review");
    expect(levelOf({ ...stable, temp: 39 }, "temp")).toBe("urgent");
  });
});

describe("shock index", () => {
  it("is heart rate divided by systolic BP", () => {
    expect(shockIndex(126, 86)).toBe(1.47);
    expect(shockIndex(78, 118)).toBe(0.66);
  });

  it("0.9 suggests review and 1.4 suggests urgent review", () => {
    expect(levelOf({ ...stable, hr: 89, sys: 100 }, "si")).toBe("none");
    expect(levelOf({ ...stable, hr: 90, sys: 100 }, "si")).toBe("review");
    expect(levelOf({ ...stable, hr: 140, sys: 100 }, "si")).toBe("urgent");
  });
});

describe("review prompt wording", () => {
  it("formats compact messages for the alert panel", () => {
    const r = evaluateReview(fromScenario("urgent")).reasons;
    expect(r.map((x) => x.short)).toEqual([
      "HR 126 ≥ 120",
      "SBP 86 < 90",
      "SI 1.47 ≥ 1.40",
      "SpO₂ 92 < 94",
      "RR 26 ≥ 25",
      "EBL 1150 ≥ 1000",
    ]);
  });
});
