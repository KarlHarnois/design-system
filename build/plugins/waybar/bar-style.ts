import type { ResolvedTheme } from "../shared/resolved-theme.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";

const color = GtkColorPalette.reference;
const CLOCK_SELECTORS = ["#clock.date", "#clock.time"];

export type BarPlacement = { [setting: string]: number };

export type BarColors = { text: string; emphasis: string; marker: string };

export abstract class BarStyle {
  abstract readonly name: string;
  protected readonly theme: ResolvedTheme;

  constructor(theme: ResolvedTheme) {
    this.theme = theme;
  }

  static all(theme: ResolvedTheme): BarStyle[] {
    return [new FloatingBar(theme), new BorderlessBar(theme)];
  }

  abstract placement(): BarPlacement;

  abstract colors(): BarColors;

  abstract windowGapTop(): number;

  abstract boxDeclarations(): string[];

  rules(): string[] {
    return [];
  }

  protected textDeclaration(): string {
    return `color: ${color(this.colors().text)};`;
  }

  protected frameMargins(): BarPlacement {
    const frame = this.frame();
    return { "margin-top": frame, "margin-right": frame, "margin-left": frame };
  }

  protected line(): number {
    return this.theme.pixels("bar.line");
  }

  protected inset(): number {
    return this.theme.pixels("space.inset");
  }

  protected outline(): number {
    return this.theme.pixels("border.width.default");
  }

  protected frame(): number {
    return this.theme.pixels("space.frame");
  }
}

export class FloatingBar extends BarStyle {
  readonly name = "floating";

  colors(): BarColors {
    return { text: "color.text.secondary", emphasis: "color.text.primary", marker: "color.focus" };
  }

  placement(): BarPlacement {
    return { height: this.line() + 2 * this.inset() + 2 * this.outline(), ...this.frameMargins() };
  }

  windowGapTop(): number {
    return this.theme.pixels("space.cell");
  }

  boxDeclarations(): string[] {
    return [
      `background-color: ${color("color.surface.base")};`,
      this.textDeclaration(),
      `border: ${this.outline()}px solid ${color("color.border.default")};`,
      `border-radius: ${this.theme.dimension("radius.container")};`,
      `padding: ${this.inset()}px;`,
    ];
  }
}

export class BorderlessBar extends BarStyle {
  readonly name = "borderless";

  colors(): BarColors {
    const desktopText = "color.text.desktop";
    return { text: desktopText, emphasis: desktopText, marker: desktopText };
  }

  placement(): BarPlacement {
    return { ...this.frameMargins(), height: this.line(), "margin-top": this.floatingTextOffset() };
  }

  windowGapTop(): number {
    return this.floatingTextOffset();
  }

  boxDeclarations(): string[] {
    return ["background-color: transparent;", this.textDeclaration()];
  }

  private floatingTextOffset(): number {
    return this.outline() + this.inset();
  }

  rules(): string[] {
    return [`${CLOCK_SELECTORS.join(",\n")} {
  padding: 0;
}`];
  }
}
