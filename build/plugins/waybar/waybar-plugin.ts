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
    for (const theme of this.themeNames) {
      const resolved = new ResolvedTheme({ theme }, resolver);
      outputFile(`waybar/${theme}/colors.css`, new GtkColorPalette(resolved).stylesheet());
      outputFile(`waybar/${theme}/style.css`, new WaybarStylesheet(resolved).render());
    }
  }
}
