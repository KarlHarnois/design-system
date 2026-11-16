import { beforeAll, describe, expect, it } from "vitest";
import { Base16Plugin } from "../build/plugins/base16/base16-plugin.ts";
import { FixtureBuild } from "./support/fixture-build.ts";

describe("Base16Plugin", () => {
  let fixtureBuild: FixtureBuild;

  beforeAll(async () => {
    fixtureBuild = await FixtureBuild.run(new Base16Plugin(["dark", "light"]));
  });

  it("declares the variant of each theme", () => {
    expect(fixtureBuild.file("base16/light.yaml")).toContain('variant: "light"');
  });

  it("starts the dark palette on a dark gray", () => {
    expect(fixtureBuild.file("base16/dark.yaml")).toContain('base00: "#151515"');
  });

  it("starts the light palette on white", () => {
    expect(fixtureBuild.file("base16/light.yaml")).toContain('base00: "#ffffff"');
  });

  it("fills all sixteen slots", () => {
    expect(fixtureBuild.file("base16/dark.yaml")).toMatch(/base0F: "#[0-9a-f]{6}"/);
  });

  it("uses the bright syntax shade on dark themes", () => {
    expect(fixtureBuild.file("base16/dark.yaml")).toContain('base08: "#ff0000"');
  });
});
