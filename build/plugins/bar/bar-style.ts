import type { ResolvedTheme } from "../shared/resolved-theme.ts";

const STYLE_GROUP = "component.bar-style";

export type BarPlacement = { [setting: string]: number };

export class BarStyle {
  readonly name: string;
  private readonly theme: ResolvedTheme;

  constructor(name: string, theme: ResolvedTheme) {
    this.name = name;
    this.theme = theme;
  }

  static all(theme: ResolvedTheme): BarStyle[] {
    const names = theme.idsUnder(STYLE_GROUP).map((id) => id.slice(STYLE_GROUP.length + 1).split(".")[0]);
    return [...new Set(names)].map((name) => new BarStyle(name, theme));
  }

  properties(): string[] {
    const prefix = `${STYLE_GROUP}.${this.name}.`;
    return this.theme.idsUnder(`${STYLE_GROUP}.${this.name}`).map((id) => id.slice(prefix.length));
  }

  tokenId(property: string): string {
    return `${STYLE_GROUP}.${this.name}.${property}`;
  }

  pixels(property: string): number {
    return this.theme.pixels(this.tokenId(property));
  }

  placement(): BarPlacement {
    const inline = this.pixels("margin-inline");
    return {
      height: this.theme.pixels("bar.line") + 2 * this.pixels("padding") + 2 * this.pixels("outline-width"),
      "margin-top": this.pixels("margin-top"),
      "margin-right": inline,
      "margin-left": inline,
    };
  }
}
