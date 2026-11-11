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
