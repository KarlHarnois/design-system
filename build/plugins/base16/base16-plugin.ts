import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import { Base16Scheme } from "./base16-scheme.ts";

export class Base16Plugin implements Plugin {
  readonly name = "base16";
  private readonly themeNames: string[];

  constructor(themeNames: string[]) {
    this.themeNames = themeNames;
  }

  build({ resolver, outputFile }: BuildHookOptions): void {
    for (const themeName of this.themeNames) {
      const scheme = new Base16Scheme(new ResolvedTheme({ theme: themeName }, resolver));
      outputFile(`base16/${themeName}.yaml`, scheme.render());
    }
  }
}
