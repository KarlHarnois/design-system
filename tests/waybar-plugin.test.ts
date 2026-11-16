import { beforeAll, describe, expect, it } from "vitest";
import { WaybarPlugin } from "../build/plugins/waybar/waybar-plugin.ts";
import { FixtureBuild } from "./support/fixture-build.ts";

describe("WaybarPlugin", () => {
  let fixtureBuild: FixtureBuild;

  beforeAll(async () => {
    fixtureBuild = await FixtureBuild.run(new WaybarPlugin(["dark", "light"]));
  });

  const stylesheet = () => fixtureBuild.file("waybar/dark/style.css");

  it("defines each color token as a GTK hex color", () => {
    expect(fixtureBuild.file("waybar/dark/colors.css")).toContain("@define-color color_surface_base #000000;");
  });

  it("resolves colors per theme", () => {
    expect(fixtureBuild.file("waybar/light/colors.css")).toContain("@define-color color_surface_base #ffffff;");
  });

  it("sets the whole bar in the small type family", () => {
    expect(stylesheet()).toContain('font-family: "Fixture Wide", monospace;');
  });

  it("sets the whole bar in the small type size", () => {
    expect(stylesheet()).toContain("font-size: 8px;");
  });

  it("makes each label one small type line tall", () => {
    expect(stylesheet()).toMatch(/label,\nbutton \{\n {2}min-height: 30px;/);
  });

  it("outlines the bar in the default border color", () => {
    expect(stylesheet()).toContain("border: 2px solid @color_border_default;");
  });

  it("rounds the bar with the container radius", () => {
    expect(stylesheet()).toContain("border-radius: 6px;");
  });

  it("inverts the current workspace on the focus color", () => {
    expect(stylesheet()).toMatch(/#workspaces button\.active \{\n {2}background: @color_focus;\n {2}color: @color_text_inverse;/);
  });

  it("separates the window title from the other groups by two cells", () => {
    expect(stylesheet()).toMatch(/#window \{\n {2}margin: 0 10px;/);
  });

  it("sets the time in the primary text color", () => {
    expect(stylesheet()).toMatch(/#clock\.time \{\n {2}color: @color_text_primary;/);
  });

  it("inverts a critical battery unless it is charging", () => {
    expect(stylesheet()).toContain("#battery.critical:not(.charging) {");
  });
});
