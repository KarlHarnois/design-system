import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";
import { WaybarStylesheet } from "./waybar-stylesheet.ts";

export class WaybarPlugin implements Plugin {
  readonly name = "waybar";
  private readonly themeNames: string[];
  private readonly accentNames: string[];

  constructor(themeNames: string[], accentNames: string[]) {
    this.themeNames = themeNames;
    this.accentNames = accentNames;
  }

  build({ resolver, outputFile }: BuildHookOptions): void {
    for (const theme of this.themeNames) {
      for (const accent of this.accentNames) {
        const resolved = new ResolvedTheme({ theme, accent }, resolver);
        outputFile(`waybar/${theme}/${accent}/colors.css`, new GtkColorPalette(resolved).stylesheet());
        outputFile(`waybar/${theme}/${accent}/style.css`, new WaybarStylesheet(resolved).render());
      }
    }
  }
}
