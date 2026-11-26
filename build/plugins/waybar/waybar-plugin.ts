import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import type { BarSpec } from "../bar/bar-spec.ts";
import { BarStyle } from "../bar/bar-style.ts";
import { SvgImage } from "../bar/svg-image.ts";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";
import { WaybarConfig } from "./waybar-config.ts";
import { WaybarStylesheet } from "./waybar-stylesheet.ts";

type OutputFile = BuildHookOptions["outputFile"];

export class WaybarPlugin implements Plugin {
  readonly name = "waybar";
  private readonly themeNames: string[];
  private readonly spec: BarSpec;

  constructor(themeNames: string[], spec: BarSpec) {
    this.themeNames = themeNames;
    this.spec = spec;
  }

  build({ resolver, outputFile }: BuildHookOptions): void {
    for (const themeName of this.themeNames) {
      const theme = new ResolvedTheme({ theme: themeName }, resolver);
      for (const style of BarStyle.all(theme)) {
        this.writeStyle(outputFile, theme, style);
      }
    }
  }

  private writeStyle(outputFile: OutputFile, theme: ResolvedTheme, style: BarStyle): void {
    const directory = `waybar/${theme.name}/${style.name}`;
    const spec = this.spec.forStyle(style.name);
    const config = new WaybarConfig(style, spec);
    outputFile(`${directory}/colors.css`, new GtkColorPalette(theme).stylesheet());
    outputFile(`${directory}/style.css`, new WaybarStylesheet(theme, style, spec).render());
    outputFile(`${directory}/config.jsonc`, config.render());
    outputFile(`${directory}/settings.json`, `${JSON.stringify(config.toJSON(), null, 2)}\n`);
    for (const image of spec.images()) {
      const tint = theme.cssColor(style.tokenId("text"));
      outputFile(`${directory}/${image}`, new SvgImage(spec.imageSource(image)).tinted(tint));
    }
  }
}
