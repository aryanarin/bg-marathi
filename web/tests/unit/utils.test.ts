import { describe, expect, it } from "vitest";

import { cn, formatDuration, percentage } from "@/lib/utils";

describe("formatDuration", () => {
  it("shows a friendly value for zero and invalid input", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(-10)).toBe("0 min");
    expect(formatDuration(Number.NaN)).toBe("0 min");
  });

  it("avoids showing '0 min' for a short but real session", () => {
    expect(formatDuration(1)).toBe("< 1 min");
    expect(formatDuration(59)).toBe("< 1 min");
  });

  it("formats whole minutes", () => {
    expect(formatDuration(60)).toBe("1 min");
    expect(formatDuration(1_800)).toBe("30 min");
    expect(formatDuration(3_599)).toBe("59 min");
  });

  it("formats hours, omitting a zero minute part", () => {
    expect(formatDuration(3_600)).toBe("1 hr");
    expect(formatDuration(7_200)).toBe("2 hr");
    expect(formatDuration(5_400)).toBe("1 hr 30 min");
    expect(formatDuration(36_000)).toBe("10 hr");
  });
});

describe("percentage", () => {
  it("returns 0 when the total is zero, rather than NaN", () => {
    expect(percentage(0, 0)).toBe(0);
    expect(percentage(5, 0)).toBe(0);
  });

  it("computes a rounded percentage", () => {
    expect(percentage(1, 2)).toBe(50);
    expect(percentage(1, 3)).toBe(33);
    expect(percentage(2, 3)).toBe(67);
    expect(percentage(47, 47)).toBe(100);
  });

  it("clamps out-of-range values", () => {
    expect(percentage(10, 5)).toBe(100);
    expect(percentage(-5, 10)).toBe(0);
  });
});

describe("cn", () => {
  it("merges conflicting Tailwind utilities, last one winning", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });
});
