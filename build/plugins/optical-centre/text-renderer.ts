import type { FontMetrics } from "./font-metrics.ts";

export interface TextRenderer {
  readonly target: string;
  baseline(metrics: FontMetrics, sizePx: number, lineHeightPx: number): number;
}

export class ChromiumRenderer implements TextRenderer {
  readonly target = "web";

  baseline(metrics: FontMetrics, sizePx: number, lineHeightPx: number): number {
    const ascent = metrics.em(metrics.hhea.ascender, sizePx);
    const descent = metrics.em(-metrics.hhea.descender, sizePx);
    return (lineHeightPx - ascent - descent) / 2 + ascent;
  }
}

export class PangoRenderer implements TextRenderer {
  readonly target = "gtk";

  baseline(metrics: FontMetrics, sizePx: number, lineHeightPx: number): number {
    const ascent = Math.ceil(metrics.em(metrics.typo.ascender, sizePx));
    const descent = Math.ceil(metrics.em(-metrics.typo.descender, sizePx));
    return Math.floor((lineHeightPx - ascent - descent) / 2) + ascent;
  }
}
