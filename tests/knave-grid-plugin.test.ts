import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { GridTypeStyle } from "../build/plugins/knave-grid/grid-type-style.ts";
import { KnaveGridPlugin } from "../build/plugins/knave-grid/knave-grid-plugin.ts";
import { FixtureBuild } from "./support/fixture-build.ts";

const FONT_DIRECTORY = "/fixture/fonts";

describe("KnaveGridPlugin", () => {
  let spec: string;

  beforeAll(async () => {
    const specPath = join(mkdtempSync(join(tmpdir(), "knave-grid-")), "design-grid.knv");
    await FixtureBuild.run(new KnaveGridPlugin(specPath, FONT_DIRECTORY));
    spec = readFileSync(specPath, "utf8");
  });

  it("reads fonts from the given directory", () => {
    expect(spec).toContain(`(fonts :from "${FONT_DIRECTORY}"`);
  });

  it("names a font file for each weight the styles use", () => {
    expect(spec).toContain('(mono "Fixture Mono" (bold "fixture-mono-bold.woff2") (regular "fixture-mono-regular.woff2"))');
  });

  it("sets the body from the ui type style", () => {
    expect(spec).toContain("(body mono :size 10.0 :line-height 1.5)");
  });

  it("lists type areas from narrowest to widest", () => {
    expect(spec.indexOf("(narrow")).toBeLessThan(spec.indexOf("(wide"));
  });

  it("counts a type style's height in lines and leaves out a size knave-grid derives", () => {
    expect(spec).toContain("(title :lines 2 :weight bold)");
  });

  it("sets one-line styles on their own line in their own family", () => {
    expect(spec).toContain("(note :lines 1 :weight regular :font-family prose :baseline-line 1)");
  });
});

describe("GridTypeStyle", () => {
  it("rejects a line height that is not a whole number of lines", () => {
    const style = new GridTypeStyle("odd", {
      fontFamily: ["Fixture Mono"],
      fontSize: { value: 10, unit: "px" },
      fontWeight: 400,
      lineHeight: 1.7,
      letterSpacing: { value: 0, unit: "px" },
    });

    expect(() => style.lines(15)).toThrow('Type style "odd" is 17px tall, not a whole number of 15px lines');
  });
});
