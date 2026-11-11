import { describe, expect, it } from "vitest";

import { evaluateReview } from "@/lib/nafascare/review-rules";
import { SCENARIOS } from "@/lib/nafascare/scenarios";

const fromScenario = (id: keyof typeof SCENARIOS) => {
  const s = SCENARIOS[id];
  return { hr: s.vitals.hr, sys: s.vitals.sys, spo2: s.vitals.spo2, ebl: s.eblPreset };
};

describe("demo review prompts", () => {
  it("Stable scenario raises no review prompt", () => {
    expect(evaluateReview(fromScenario("stable")).level).toBe("none");
  });

  it("Clinical Review scenario raises a clinical review prompt", () => {
    expect(evaluateReview(fromScenario("review")).level).toBe("review");
  });

  it("Urgent Review scenario raises an urgent review prompt", () => {
    expect(evaluateReview(fromScenario("urgent")).level).toBe("urgent");
  });

  it("manually entered blood loss of 500 mL raises a review prompt on otherwise stable values", () => {
    expect(evaluateReview({ ...fromScenario("stable"), ebl: 500 }).level).toBe("review");
  });
});

describe("review prompt wording", () => {
  it("formats full and compact messages", () => {
    const r = evaluateReview({ hr: 126, sys: 86, spo2: 92, ebl: 1150 }).reasons;
    expect(r.map((x) => x.message)).toEqual([
      "HR 126 bpm ≥ demo threshold 120",
      "Systolic BP 86 mmHg < demo threshold 90",
      "SpO₂ 92% < demo threshold 94%",
      "Recorded EBL 1150 mL ≥ demo threshold 1000 mL",
    ]);
    expect(r.map((x) => x.short)).toEqual(["HR 126 ≥ 120", "SBP 86 < 90", "SpO₂ 92 < 94", "EBL 1150 ≥ 1000 mL"]);
  });
});
