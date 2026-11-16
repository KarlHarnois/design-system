import { beforeAll, describe, expect, it } from "vitest";
import { WaybarPlugin } from "../build/plugins/waybar/waybar-plugin.ts";
import { FixtureBuild } from "./support/fixture-build.ts";

describe("WaybarPlugin", () => {
  let fixtureBuild: FixtureBuild;

  beforeAll(async () => {
    fixtureBuild = await FixtureBuild.run(new WaybarPlugin(["dark", "light"]));
  });

  it("defines each color token as a GTK hex color", () => {
    expect(fixtureBuild.file("waybar/dark/colors.css")).toContain("@define-color color_surface_base #000000;");
  });

  it("resolves colors per theme", () => {
    expect(fixtureBuild.file("waybar/light/colors.css")).toContain("@define-color color_surface_base #ffffff;");
  });

  it("styles the bar with color references instead of literal colors", () => {
    expect(fixtureBuild.file("waybar/dark/style.css")).toContain("background-color: @color_surface_base;");
  });

  it("leaves generic font families unquoted", () => {
    expect(fixtureBuild.file("waybar/dark/style.css")).toContain('font-family: "Fixture Mono", monospace;');
  });

  it("sizes the bar from the bar height token", () => {
    expect(fixtureBuild.file("waybar/dark/style.css")).toContain("min-height: 30px;");
  });
});
