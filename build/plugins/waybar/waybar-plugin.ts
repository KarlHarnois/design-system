import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";
import { WaybarStylesheet } from "./waybar-stylesheet.ts";

export class WaybarPlugin implements Plugin {
  readonly name = "waybar";
  private readonly themeNames: string[];

  constructor(themeNames: string[]) {
    this.themeNames = themeNames;
  }

  build({ resolver, outputFile }: BuildHookOptions): void {
    for (const themeName of this.themeNames) {
      const theme = new ResolvedTheme(themeName, resolver);
      outputFile(`waybar/${themeName}/colors.css`, new GtkColorPalette(theme).stylesheet());
      outputFile(`waybar/${themeName}/style.css`, new WaybarStylesheet(theme).render());
    }
  }
}
