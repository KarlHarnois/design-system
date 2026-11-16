import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import type { BarSpec } from "../bar/bar-spec.ts";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
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
      outputFile(`waybar/${theme}/colors.css`, new GtkColorPalette(resolved).stylesheet());
      outputFile(`waybar/${theme}/style.css`, new WaybarStylesheet(resolved, this.spec).render());
      const config = new WaybarConfig(resolved, this.spec);
      outputFile(`waybar/${theme}/config.jsonc`, config.render());
      outputFile(`waybar/${theme}/settings.json`, `${JSON.stringify(config.toJSON(), null, 2)}\n`);
    }
  }
}
