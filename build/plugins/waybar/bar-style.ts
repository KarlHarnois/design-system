import type { ResolvedTheme } from "../shared/resolved-theme.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";

const color = GtkColorPalette.reference;

export type BarPlacement = { [setting: string]: number };

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

  abstract boxDeclarations(): string[];

  protected textDeclaration(): string {
    return `color: ${color("color.text.secondary")};`;
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

  placement(): BarPlacement {
    return { height: this.line() + 2 * this.inset() + 2 * this.outline(), ...this.frameMargins() };
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

  placement(): BarPlacement {
    const textOnFrame = this.frame() - this.theme.pixels("space.marker");
    return { height: this.line(), "margin-top": this.frame(), "margin-right": textOnFrame, "margin-left": textOnFrame };
  }

  boxDeclarations(): string[] {
    return ["background-color: transparent;", this.textDeclaration()];
  }
}
