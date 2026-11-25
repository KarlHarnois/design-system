import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import type { BarSpec } from "../bar/bar-spec.ts";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import { BarStyle } from "./bar-style.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";
import { WaybarConfig } from "./waybar-config.ts";
import { WaybarStylesheet } from "./waybar-stylesheet.ts";

export class WaybarPlugin implements Plugin {
  readonly name = "waybar";
  private readonly themeNames: string[];
  private readonly spec: BarSpec;

  constructor(themeNames: string[], spec: BarSpec) {
    this.themeNames = themeNames;
    this.spec = spec;
  }

  build({ resolver, outputFile }: BuildHookOptions): void {
    for (const theme of this.themeNames) {
      const resolved = new ResolvedTheme({ theme }, resolver);
      for (const style of BarStyle.all(resolved)) {
        const directory = `waybar/${theme}/${style.name}`;
        outputFile(`${directory}/colors.css`, new GtkColorPalette(resolved).stylesheet());
        outputFile(`${directory}/style.css`, new WaybarStylesheet(resolved, style, this.spec).render());
        const config = new WaybarConfig(style, this.spec);
        outputFile(`${directory}/config.jsonc`, config.render());
        outputFile(`${directory}/settings.json`, `${JSON.stringify(config.toJSON(), null, 2)}\n`);
      }
    }
  }
}
