import { beforeAll, describe, expect, it } from "vitest";
import type { ResolvedTheme } from "../build/plugins/shared/resolved-theme.ts";
import { DesignTokens } from "./support/design-tokens.ts";

describe("nesting", () => {
  let tokens: ResolvedTheme;

  beforeAll(async () => {
    tokens = await DesignTokens.load();
  });

  it("insets containers at least as far as their corner radius, so inner shapes stay square", () => {
    const radius = tokens.pixels("radius.container");
    const inset = tokens.pixels("space.inset");
    const message =
      `space.inset (${inset}px) is smaller than radius.container (${radius}px). ` +
      `Inner shapes would then need a radius of ${radius - inset}px (radius minus inset), which needs a decision. ` +
      "See docs/decisions/0012-nesting.md.";

    expect(inset >= radius, message).toBe(true);
  });

  it("rounds controls by the container radius minus the inset, never below 0", () => {
    const concentricRadius = Math.max(0, tokens.pixels("radius.container") - tokens.pixels("space.inset"));

    expect(tokens.pixels("radius.control")).toBe(concentricRadius);
  });
});
