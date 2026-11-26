import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import { BarStyle } from "../bar/bar-style.ts";
import { HyprlandLuaScript } from "./hyprland-lua-script.ts";
import { HyprlandSettings } from "./hyprland-settings.ts";

export class HyprlandPlugin implements Plugin {
  readonly name = "hyprland";
  private readonly themeNames: string[];

  constructor(themeNames: string[]) {
    this.themeNames = themeNames;
  }

  build({ resolver, outputFile }: BuildHookOptions): void {
    for (const themeName of this.themeNames) {
      const theme = new ResolvedTheme({ theme: themeName }, resolver);
      for (const bar of BarStyle.all(theme)) {
        const directory = `hyprland/${themeName}/${bar.name}`;
        const settings = new HyprlandSettings(theme, bar).toJSON();
        outputFile(`${directory}/theme.lua`, new HyprlandLuaScript(settings).render());
        outputFile(`${directory}/settings.json`, `${JSON.stringify(settings, null, 2)}\n`);
      }
    }
  }
}
