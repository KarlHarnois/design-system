import { beforeAll, describe, expect, it } from "vitest";
import type { ResolvedTheme } from "../build/plugins/shared/resolved-theme.ts";
import { DesignTokens } from "./support/design-tokens.ts";

describe("bar tokens", () => {
  let tokens: ResolvedTheme;

  beforeAll(async () => {
    tokens = await DesignTokens.load();
  });

  const floating = (property: string) => tokens.pixels(`component.bar-style.floating.${property}`);
  const borderless = (property: string) => tokens.pixels(`component.bar-style.borderless.${property}`);
  const floatingHeight = () => tokens.pixels("bar.line") + 2 * floating("padding") + 2 * floating("outline-width");

  it("sets the borderless text as far down as the floating bar's outline and padding", () => {
    expect(borderless("margin-top")).toBe(floating("outline-width") + floating("padding"));
  });

  it("starts the windows under the borderless bar one floating bar height below the screen top", () => {
    const top = borderless("margin-top") + tokens.pixels("bar.line") + borderless("window-gap");

    expect(top).toBe(floatingHeight());
  });

  it("makes a bar image as tall as the bar's type", () => {
    const { fontSize } = tokens.typography("type.ui-small");

    expect(tokens.pixels("component.bar.image-height")).toBe(fontSize.value);
  });

  it("insets the borderless bar's sides by the frame plus the windows' corner radius", () => {
    const expected = tokens.pixels("space.frame") + tokens.pixels("radius.container");

    expect(borderless("margin-inline")).toBe(expected);
  });
});
