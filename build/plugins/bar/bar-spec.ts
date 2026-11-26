import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type BarSample = { values?: { [name: string]: number }; time?: string; items?: string[]; active?: string };

export type BarModule = {
  name: string;
  waybar: string;
  format: string;
  image?: string;
  icons?: { [name: string]: string };
  width?: number;
  align?: "left" | "right";
  variants?: { [variant: string]: string };
  states?: { [state: string]: { below: number; format?: string } };
  sample: BarSample;
  stateSamples?: (BarSample & { variant?: string; state?: string })[];
};

export type BarGroup = { name: string; styles?: string[]; modules: BarModule[] };

export type BarSpecJson = { left: BarGroup[]; right: BarGroup[] };

export class BarSpec {
  readonly left: BarGroup[];
  readonly right: BarGroup[];
  private readonly directory: string;

  constructor({ left, right }: BarSpecJson, directory: string) {
    this.left = left;
    this.right = right;
    this.directory = directory;
  }

  static read(path: string): BarSpec {
    return new BarSpec(JSON.parse(readFileSync(path, "utf8")), dirname(path));
  }

  forStyle(style: string): BarSpec {
    const shown = (group: BarGroup) => group.styles === undefined || group.styles.includes(style);
    return new BarSpec({ left: this.left.filter(shown), right: this.right.filter(shown) }, this.directory);
  }

  modules(): BarModule[] {
    return [...this.left, ...this.right].flatMap((group) => group.modules);
  }

  images(): string[] {
    return this.modules().flatMap((module) => (module.image === undefined ? [] : [module.image]));
  }

  imageSource(image: string): string {
    return readFileSync(join(this.directory, image), "utf8");
  }

  toJSON(): BarSpecJson {
    return { left: this.left, right: this.right };
  }
}
