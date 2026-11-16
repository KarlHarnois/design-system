import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

const schema = readJson("../bar/bar.schema.json");
const bar = readJson("../bar/bar.json");

describe("bar spec", () => {
  it("matches its schema", () => {
    const validate = new Ajv2020({ allErrors: true }).compile(schema);

    expect(validate(bar), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it("names a variant or a state in every state sample", () => {
    const modules = [...bar.left, ...bar.right].flatMap((group) => group.modules);
    const samples = modules.flatMap((module) => module.stateSamples ?? []);

    for (const sample of samples) {
      expect(sample.variant ?? sample.state).toBeDefined();
    }
  });
});
