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

  protected surfaceDeclarations(): string[] {
    return [`background-color: ${color("color.surface.base")};`, `color: ${color("color.text.secondary")};`];
  }

  protected contentHeight(): number {
    return this.theme.pixels("bar.line") + 2 * this.inset();
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
    const frame = this.frame();
    return {
      height: this.contentHeight() + 2 * this.outline(),
      "margin-top": frame,
      "margin-right": frame,
      "margin-left": frame,
    };
  }

  boxDeclarations(): string[] {
    return [
      ...this.surfaceDeclarations(),
      `border: ${this.outline()}px solid ${color("color.border.default")};`,
      `border-radius: ${this.theme.dimension("radius.container")};`,
      `padding: ${this.inset()}px;`,
    ];
  }
}

export class BorderlessBar extends BarStyle {
  readonly name = "borderless";

  placement(): BarPlacement {
    return { height: this.contentHeight() };
  }

  boxDeclarations(): string[] {
    return [...this.surfaceDeclarations(), `padding: ${this.inset()}px ${this.floatingContentEdge()}px;`];
  }

  private floatingContentEdge(): number {
    return this.frame() + this.outline() + this.inset();
  }
}
