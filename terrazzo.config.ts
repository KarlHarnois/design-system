import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import { WaybarPlugin } from "./build/plugins/waybar/waybar-plugin.ts";

const THEMES = ["dark", "light"];

export default defineConfig({
  tokens: ["./tokens/resolver.json"],
  outDir: "./dist/",
  plugins: [
    css({
      filename: "css/tokens.css",
      permutations: [
        { input: { theme: "dark" }, prepare: (declarations) => `:root {\n  color-scheme: dark;\n${declarations}\n}` },
        { input: { theme: "light" }, prepare: (declarations) => `[data-theme="light"] {\n  color-scheme: light;\n${declarations}\n}` },
      ],
    }),
    new WaybarPlugin(THEMES),
  ],
});
