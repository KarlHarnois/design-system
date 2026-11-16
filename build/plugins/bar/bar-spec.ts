import { readFileSync } from "node:fs";

export type BarSample = { values?: { [name: string]: number }; time?: string; items?: string[]; active?: string };

export type BarModule = {
  name: string;
  waybar: string;
  format: string;
  width?: number;
  align?: "left" | "right";
  variants?: { [variant: string]: string };
  states?: { [state: string]: { below: number } };
  sample: BarSample;
  stateSamples?: (BarSample & { variant?: string; state?: string })[];
};

export type BarSpecJson = { left: BarModule[]; right: BarModule[] };

export class BarSpec {
  readonly left: BarModule[];
  readonly right: BarModule[];

  constructor({ left, right }: BarSpecJson) {
    this.left = left;
    this.right = right;
  }

  static read(path: string): BarSpec {
    return new BarSpec(JSON.parse(readFileSync(path, "utf8")));
  }

  modules(): BarModule[] {
    return [...this.left, ...this.right];
  }

  toJSON(): BarSpecJson {
    return { left: this.left, right: this.right };
  }
}
