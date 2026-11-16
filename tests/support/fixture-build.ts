import { readFile } from "node:fs/promises";
import { build, defineConfig, parse, type Plugin } from "@terrazzo/parser";

const FIXTURE_DIRECTORY = new URL("../fixtures/tokens/", import.meta.url);

export class FixtureBuild {
  private readonly files = new Map<string, string>();

  static async run(plugin: Plugin): Promise<FixtureBuild> {
    const fixtureBuild = new FixtureBuild();
    await fixtureBuild.collect(plugin);
    return fixtureBuild;
  }

  file(filename: string): string {
    const contents = this.files.get(filename);
    if (contents === undefined) {
      throw new Error(`Build produced no "${filename}". Files: ${[...this.files.keys()].join(", ")}`);
    }
    return contents;
  }

  private async collect(plugin: Plugin): Promise<void> {
    const resolverUrl = new URL("resolver.json", FIXTURE_DIRECTORY);
    const config = defineConfig({ tokens: [resolverUrl.href], plugins: [plugin] }, { cwd: FIXTURE_DIRECTORY });
    const source = { filename: resolverUrl, src: await readFile(resolverUrl, "utf8") };
    const { tokens, sources, resolver } = await parse([source], { config });
    const { outputFiles } = await build(tokens, { sources, resolver, config });
    for (const { filename, contents } of outputFiles) {
      this.files.set(filename, contents.toString());
    }
  }
}
