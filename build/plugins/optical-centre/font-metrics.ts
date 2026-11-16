export type VerticalExtent = { ascender: number; descender: number };

export class FontMetrics {
  readonly unitsPerEm: number;
  readonly hhea: VerticalExtent;
  readonly typo: VerticalExtent;
  readonly capHeight: number;
  readonly xHeight: number;

  constructor(unitsPerEm: number, hhea: VerticalExtent, typo: VerticalExtent, capHeight: number, xHeight: number) {
    this.unitsPerEm = unitsPerEm;
    this.hhea = hhea;
    this.typo = typo;
    this.capHeight = capHeight;
    this.xHeight = xHeight;
  }

  em(units: number, sizePx: number): number {
    return (units / this.unitsPerEm) * sizePx;
  }

  opticalHeight(sizePx: number): number {
    return this.em((this.capHeight + this.xHeight) / 2, sizePx);
  }
}

export interface FontMetricsSource {
  metrics(fileName: string): FontMetrics;
}
