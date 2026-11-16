import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

const schema = readJson("../keymap/keymap.schema.json");
const keymap = readJson("../keymap/keymap.json");

describe("keymap", () => {
  it("matches its schema", () => {
    const validate = new Ajv2020({ allErrors: true }).compile(schema);

    expect(validate(keymap), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });
});
