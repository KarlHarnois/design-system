import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import { KnaveGridSpec } from "./knave-grid-spec.ts";

export class KnaveGridPlugin implements Plugin {
  readonly name = "knave-grid";
  private readonly specPath: string;
  private readonly fontDirectory: string;

  constructor(specPath: string, fontDirectory: string) {
    this.specPath = specPath;
    this.fontDirectory = fontDirectory;
  }

  build({ resolver }: BuildHookOptions): void {
    const tokens = new ResolvedTheme(resolver.inputDefault, resolver);
    mkdirSync(dirname(this.specPath), { recursive: true });
    writeFileSync(this.specPath, new KnaveGridSpec(tokens, this.fontDirectory).render());
  }
}
