import type { BarGroup } from "../bar/bar-spec.ts";
import { WaybarModule } from "./waybar-module.ts";

export class WaybarGroup {
  private readonly group: BarGroup;

  constructor(group: BarGroup) {
    this.group = group;
  }

  get modules(): WaybarModule[] {
    return this.group.modules.map((module) => new WaybarModule(module));
  }

  get isPhrase(): boolean {
    return this.group.phrase ?? false;
  }

  get spaceAfter(): string | undefined {
    return this.group.spaceAfter;
  }

  get isSingle(): boolean {
    return this.group.modules.length === 1;
  }

  reference(): string {
    return this.isSingle ? this.modules[0].name : `group/${this.group.name}`;
  }

  selector(): string {
    return this.isSingle ? this.modules[0].selector() : `box#${this.group.name}`;
  }

  settings(): { [key: string]: unknown } {
    if (this.isSingle) return {};
    return { [this.reference()]: { orientation: "inherit", modules: this.modules.map((module) => module.name) } };
  }
}
