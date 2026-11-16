import { beforeAll, describe, expect, it } from "vitest";
import { WaybarPlugin } from "../build/plugins/waybar/waybar-plugin.ts";
import { FixtureBuild } from "./support/fixture-build.ts";

describe("WaybarPlugin", () => {
  let fixtureBuild: FixtureBuild;

  beforeAll(async () => {
    fixtureBuild = await FixtureBuild.run(new WaybarPlugin(["dark", "light"], ["red", "blue"]));
  });

  it("defines each color token as a GTK hex color", () => {
    expect(fixtureBuild.file("waybar/dark/red/colors.css")).toContain("@define-color color_surface_base #000000;");
  });

  it("resolves colors per theme", () => {
    expect(fixtureBuild.file("waybar/light/red/colors.css")).toContain("@define-color color_surface_base #ffffff;");
  });

  it("resolves the accent per accent choice", () => {
    expect(fixtureBuild.file("waybar/dark/blue/colors.css")).toContain("@define-color color_accent #0000ff;");
  });

  it("picks the accent shade per theme", () => {
    expect(fixtureBuild.file("waybar/light/red/colors.css")).toContain("@define-color color_accent #800000;");
  });

  it("styles the bar with color references instead of literal colors", () => {
    expect(fixtureBuild.file("waybar/dark/red/style.css")).toContain("background-color: @color_surface_base;");
  });

  it("leaves generic font families unquoted", () => {
    expect(fixtureBuild.file("waybar/dark/red/style.css")).toContain('font-family: "Fixture Mono", monospace;');
  });

  it("sizes the bar from the bar height token", () => {
    expect(fixtureBuild.file("waybar/dark/red/style.css")).toContain("min-height: 30px;");
  });
});
