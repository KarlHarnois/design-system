import { beforeAll, describe, expect, it } from "vitest";
import { FontMetrics, type FontMetricsSource } from "../build/plugins/optical-centre/font-metrics.ts";
import { OpticalCentrePlugin } from "../build/plugins/optical-centre/optical-centre-plugin.ts";
import { OpticalShift } from "../build/plugins/optical-centre/optical-shift.ts";
import type { TextRenderer } from "../build/plugins/optical-centre/text-renderer.ts";
import { FixtureBuild } from "./support/fixture-build.ts";

class FixtureFonts implements FontMetricsSource {
  readonly requested: string[] = [];

  metrics(fileName: string): FontMetrics {
    this.requested.push(fileName);
    return new FontMetrics(1000, { ascender: 965, descender: -215 }, { ascender: 965, descender: -285 }, 735, 520);
  }
}

class FixedBaselineRenderer implements TextRenderer {
  readonly target = "fixture";
  private readonly baselinePx: number;

  constructor(baselinePx: number) {
    this.baselinePx = baselinePx;
  }

  baseline(): number {
    return this.baselinePx;
  }
}

describe("OpticalCentrePlugin", () => {
  let fixtureBuild: FixtureBuild;
  let fonts: FixtureFonts;

  beforeAll(async () => {
    fonts = new FixtureFonts();
    fixtureBuild = await FixtureBuild.run(new OpticalCentrePlugin(fonts));
  });

  const shifts = () => JSON.parse(fixtureBuild.file("optical-centre.json"));

  it("centres between the cap height and the x-height with the browser's font box", () => {
    expect(shifts().page.web["type.ui"]).toEqual({ exact: -0.613, pixels: -1 });
  });

  it("centres with Pango's rounded typo metrics for GTK", () => {
    expect(shifts().page.gtk["type.ui"]).toEqual({ exact: -0.363, pixels: 0 });
  });

  it("covers only type styles that are one line tall", () => {
    expect(Object.keys(shifts().page.web)).toEqual(["type.note", "type.ui"]);
  });

  it("centres the small type style on the desktop bar line", () => {
    expect(shifts().bar.gtk["type.ui-small"]).toEqual({ exact: 0.51, pixels: 1 });
  });

  it("reads the font file each style ships with", () => {
    expect(fonts.requested).toContain("fixture-sans-regular.woff2");
  });
});

describe("OpticalShift", () => {
  const metrics = new FontMetrics(1000, { ascender: 800, descender: -200 }, { ascender: 800, descender: -200 }, 700, 500);

  it("moves text that needs 1.5px down by 1px, leaving it slightly high", () => {
    expect(new OpticalShift(new FixedBaselineRenderer(11.5), metrics, 10, 20).pixels).toBe(1);
  });

  it("moves text that needs 1.5px up by 2px, leaving it slightly high", () => {
    expect(new OpticalShift(new FixedBaselineRenderer(14.5), metrics, 10, 20).pixels).toBe(-2);
  });
});
