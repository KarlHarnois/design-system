import { readFileSync } from "node:fs";

export type BarSample = { values?: { [name: string]: number }; time?: string; items?: string[]; active?: string };

export type BarModule = {
  name: string;
  waybar: string;
  format: string;
  width?: number;
  align?: "left" | "right";
  variants?: { [variant: string]: string };
  states?: { [state: string]: { below: number; format?: string } };
  sample: BarSample;
  stateSamples?: (BarSample & { variant?: string; state?: string })[];
};

export type BarGroup = { name: string; modules: BarModule[] };

export type BarSpecJson = { left: BarGroup[]; right: BarGroup[] };

export class BarSpec {
  readonly left: BarGroup[];
  readonly right: BarGroup[];

  constructor({ left, right }: BarSpecJson) {
    this.left = left;
    this.right = right;
  }

  static read(path: string): BarSpec {
    return new BarSpec(JSON.parse(readFileSync(path, "utf8")));
  }

  modules(): BarModule[] {
    return [...this.left, ...this.right].flatMap((group) => group.modules);
  }

  toJSON(): BarSpecJson {
    return { left: this.left, right: this.right };
  }
}
