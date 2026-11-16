import { readFileSync } from "node:fs";
import { defineConfig } from "@terrazzo/cli";
import css from "@terrazzo/plugin-css";
import { Base16Plugin } from "./build/plugins/base16/base16-plugin.ts";
import { WaybarPlugin } from "./build/plugins/waybar/waybar-plugin.ts";

const RESOLVER_PATH = "./tokens/resolver.json";
const { modifiers } = JSON.parse(readFileSync(RESOLVER_PATH, "utf8"));
const THEMES = Object.keys(modifiers.theme.contexts);
const ACCENTS = Object.keys(modifiers.accent.contexts);

const accentPermutation = (accent: string) => ({
  input: { accent },
  include: ["accent.*"],
  prepare: (declarations: string) => `[data-accent="${accent}"] {\n${declarations}\n}`,
});

export default defineConfig({
  tokens: [RESOLVER_PATH],
  outDir: "./dist/",
  plugins: [
    css({
      filename: "css/tokens.css",
      permutations: [
        { input: { theme: "dark" }, prepare: (declarations) => `:root {\n  color-scheme: dark;\n${declarations}\n}` },
        { input: { theme: "light" }, prepare: (declarations) => `[data-theme="light"] {\n  color-scheme: light;\n${declarations}\n}` },
        ...ACCENTS.map(accentPermutation),
      ],
    }),
    new WaybarPlugin(THEMES, ACCENTS),
    new Base16Plugin(THEMES),
  ],
});
