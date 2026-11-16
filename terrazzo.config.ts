import { readFileSync } from "node:fs";
import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import { KnaveGridPlugin } from "./build/plugins/knave-grid/knave-grid-plugin.ts";
import { BarPreviewPlugin } from "./build/plugins/bar/bar-preview-plugin.ts";
import { BarSpec } from "./build/plugins/bar/bar-spec.ts";
import { Base16Plugin } from "./build/plugins/base16/base16-plugin.ts";
import { HyprlandPlugin } from "./build/plugins/hyprland/hyprland-plugin.ts";
import { OpticalCentrePlugin } from "./build/plugins/optical-centre/optical-centre-plugin.ts";
import { Woff2FontDirectory } from "./build/plugins/optical-centre/woff2-font-directory.ts";
import { WaybarPlugin } from "./build/plugins/waybar/waybar-plugin.ts";

const RESOLVER_PATH = "./tokens/resolver.json";
const { modifiers } = JSON.parse(readFileSync(RESOLVER_PATH, "utf8"));
const THEMES = Object.keys(modifiers.theme.contexts);
const GRID_SPEC_PATH = "./grid/src/design-grid.knv";
const BAR_SPEC = BarSpec.read("./bar/bar.json");

const webFontDirectory = (): string => {
  const directory = process.env.DESIGN_SYSTEM_WEB_FONTS;
  if (directory === undefined) {
    throw new Error("DESIGN_SYSTEM_WEB_FONTS is not set. Run the build inside the Nix dev shell.");
  }
  return directory;
};

export default defineConfig({
  tokens: [RESOLVER_PATH],
  outDir: "./dist/",
  plugins: [
    css({
      filename: "css/tokens.css",
      permutations: [
        { input: { theme: "dark" }, prepare: (declarations) => `:root {\n  color-scheme: dark;\n${declarations}\n}` },
        { input: { theme: "light" }, prepare: (declarations) => `[data-theme="light"] {\n  color-scheme: light;\n${declarations}\n}` },
      ],
    }),
    new WaybarPlugin(THEMES, BAR_SPEC),
    new BarPreviewPlugin(BAR_SPEC),
    new Base16Plugin(THEMES),
    new HyprlandPlugin(THEMES),
    new KnaveGridPlugin(GRID_SPEC_PATH, webFontDirectory()),
    new OpticalCentrePlugin(new Woff2FontDirectory(webFontDirectory())),
  ],
});
