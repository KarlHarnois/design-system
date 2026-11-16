import type { TypographyValueNormalized } from "@terrazzo/parser";

const PIXELS_PER_REM = 16;
const KNAVE_WEIGHT_NAMES = new Map([
  [300, "light"],
  [400, "regular"],
  [500, "medium"],
  [700, "bold"],
]);

type Dimension = { value: number; unit: string };

export class GridTypeStyle {
  readonly name: string;
  readonly fontFamily: string[];
  readonly weight: string;
  readonly sizePx: number;
  private readonly lineHeightPx: number;

  constructor(name: string, typography: TypographyValueNormalized) {
    this.name = name;
    this.fontFamily = [typography.fontFamily].flat();
    this.weight = GridTypeStyle.weightName(name, typography.fontWeight);
    this.sizePx = GridTypeStyle.pixels(typography.fontSize);
    this.lineHeightPx = GridTypeStyle.lineHeightPixels(typography.lineHeight, this.sizePx);
  }

  get leadingPx(): number {
    return this.lineHeightPx;
  }

  lines(leadingPx: number): number {
    const lines = this.lineHeightPx / leadingPx;
    if (!GridTypeStyle.isWhole(lines)) {
      throw new Error(`Type style "${this.name}" is ${this.lineHeightPx}px tall, not a whole number of ${leadingPx}px lines`);
    }
    return Math.round(lines);
  }

  usesFamily(fontFamily: string[]): boolean {
    return JSON.stringify(this.fontFamily) === JSON.stringify(fontFamily);
  }

  private static weightName(styleName: string, weight: string | number): string {
    const name = typeof weight === "number" ? KNAVE_WEIGHT_NAMES.get(weight) : weight;
    if (name === undefined || ![...KNAVE_WEIGHT_NAMES.values()].includes(name)) {
      throw new Error(`Type style "${styleName}" has weight ${weight}, which knave-grid does not support`);
    }
    return name;
  }

  private static lineHeightPixels(lineHeight: number | Dimension, sizePx: number): number {
    return typeof lineHeight === "number" ? lineHeight * sizePx : GridTypeStyle.pixels(lineHeight);
  }

  private static pixels({ value, unit }: Dimension): number {
    return unit === "px" ? value : value * PIXELS_PER_REM;
  }

  private static isWhole(value: number): boolean {
    return Math.abs(value - Math.round(value)) < 1e-6;
  }
}
