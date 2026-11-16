import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
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
      const settings = new HyprlandSettings(new ResolvedTheme({ theme: themeName }, resolver)).toJSON();
      outputFile(`hyprland/${themeName}/theme.lua`, new HyprlandLuaScript(settings).render());
      outputFile(`hyprland/${themeName}/settings.json`, `${JSON.stringify(settings, null, 2)}\n`);
    }
  }
}
