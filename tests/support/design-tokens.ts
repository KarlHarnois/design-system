import { readFile } from "node:fs/promises";
import { defineConfig, parse } from "@terrazzo/parser";
import { ResolvedTheme } from "../../build/plugins/shared/resolved-theme.ts";

const TOKEN_DIRECTORY = new URL("../../tokens/", import.meta.url);

export class DesignTokens {
  static async load(): Promise<ResolvedTheme> {
    const resolverUrl = new URL("resolver.json", TOKEN_DIRECTORY);
    const config = defineConfig({ tokens: [resolverUrl.href] }, { cwd: TOKEN_DIRECTORY });
    const source = { filename: resolverUrl, src: await readFile(resolverUrl, "utf8") };
    const { resolver } = await parse([source], { config });
    return new ResolvedTheme(resolver.inputDefault, resolver);
  }
}
