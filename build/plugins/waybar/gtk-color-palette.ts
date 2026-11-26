import type { ResolvedTheme } from "../shared/resolved-theme.ts";

export class GtkColorPalette {
  private readonly theme: ResolvedTheme;

  constructor(theme: ResolvedTheme) {
    this.theme = theme;
  }

  static reference(tokenId: string): string {
    return `@${tokenId.replaceAll(/[.-]/g, "_")}`;
  }

  stylesheet(): string {
    return this.theme
      .colorIds()
      .map((id) => this.defineColor(id))
      .join("\n")
      .concat("\n");
  }

  private defineColor(id: string): string {
    const name = GtkColorPalette.reference(id).slice(1);
    return `@define-color ${name} ${this.value(id)};`;
  }

  private value(id: string): string {
    const alias = this.theme.directAlias(id);
    return alias === undefined ? this.theme.cssColor(id) : GtkColorPalette.reference(alias);
  }
}
