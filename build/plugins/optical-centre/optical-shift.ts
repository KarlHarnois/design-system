import type { FontMetrics } from "./font-metrics.ts";
import type { TextRenderer } from "./text-renderer.ts";

const HALF_PIXEL = 0.5;

export class OpticalShift {
  readonly exact: number;

  constructor(renderer: TextRenderer, metrics: FontMetrics, sizePx: number, lineHeightPx: number) {
    const opticalCentre = renderer.baseline(metrics, sizePx, lineHeightPx) - metrics.opticalHeight(sizePx) / 2;
    this.exact = lineHeightPx / 2 - opticalCentre;
  }

  get pixels(): number {
    return Math.ceil(this.exact - HALF_PIXEL) || 0;
  }
}
