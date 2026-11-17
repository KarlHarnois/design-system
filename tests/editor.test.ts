import { beforeAll, describe, expect, it } from "vitest";
import type { ResolvedTheme } from "../build/plugins/shared/resolved-theme.ts";
import { DesignTokens } from "./support/design-tokens.ts";

describe("editor", () => {
  let tokens: ResolvedTheme;

  beforeAll(async () => {
    tokens = await DesignTokens.load();
  });

  it("keeps every editor line on the baseline grid", () => {
    expect(tokens.pixels("component.editor.line-height")).toBe(tokens.pixels("space.line"));
  });

  it("makes the editor a whole number of lines tall", () => {
    const verticalInset = 2 * tokens.pixels("component.editor.padding-block");

    expect(verticalInset % tokens.pixels("space.line")).toBe(0);
  });

  it("keeps the insert cursor narrower than a cell, so the character under it stays readable", () => {
    expect(tokens.pixels("component.editor.insert-cursor-width")).toBeLessThan(tokens.pixels("space.cell"));
  });
});
