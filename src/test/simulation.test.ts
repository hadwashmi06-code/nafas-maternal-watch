import { describe, expect, it } from "vitest";

import { createInitialState, reducer } from "@/hooks/use-nafas-simulation";

const seed = Array.from({ length: 16 }, () => 0.5);
const init = () => createInitialState(0, 1, seed);

describe("blood loss documentation", () => {
  it("adds manual and imported entries to one cumulative total, keeping each source", () => {
    let s = init();
    s = reducer(s, { type: "ebl", amount: 100, source: "manual", now: 1 });
    s = reducer(s, { type: "ebl", amount: 250, source: "imported", now: 2 });
    expect(s.eblTotal).toBe(300 + 100 + 250);
    expect(s.eblEntries.map((e) => e.source)).toEqual(["imported", "manual", "manual"]);
  });

  it("rejects entries outside 1–3000 mL", () => {
    const s = init();
    expect(reducer(s, { type: "ebl", amount: 0, source: "manual", now: 1 })).toBe(s);
    expect(reducer(s, { type: "ebl", amount: 3001, source: "imported", now: 1 })).toBe(s);
  });
});

describe("scenarios", () => {
  it("Urgent Review sets uterine tone Soft and urine output 40 mL as fictional records", () => {
    const s = reducer(init(), { type: "scenario", id: "urgent", now: 1 });
    expect(s.tone).toMatchObject({ value: "soft", by: "scenario" });
    expect(s.urineTotal).toBe(40);
    expect(s.review.level).toBe("urgent");
  });
});
