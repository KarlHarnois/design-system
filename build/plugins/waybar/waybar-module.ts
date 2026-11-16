import type { BarModule } from "../bar/bar-spec.ts";

const WAYBAR_ALIGN = { left: 0, right: 1 } as const;

export class WaybarModule {
  private readonly module: BarModule;

  constructor(module: BarModule) {
    this.module = module;
  }

  get name(): string {
    return this.module.waybar;
  }

  selector(): string {
    const [type, id] = this.module.waybar.split("#");
    const widget = type.split("/").at(-1);
    return id === undefined ? `#${widget}` : `#${widget}.${id}`;
  }

  settings(): { [key: string]: unknown } {
    const { format, width, align } = this.module;
    return {
      format,
      ...this.variantFormats(),
      ...(width === undefined ? {} : { "min-length": width }),
      ...(align === undefined ? {} : { align: WAYBAR_ALIGN[align] }),
      ...this.states(),
    };
  }

  private variantFormats(): { [key: string]: string } {
    const variants = Object.entries(this.module.variants ?? {});
    return Object.fromEntries(variants.map(([variant, format]) => [`format-${variant}`, format]));
  }

  private states(): { states?: { [state: string]: number } } {
    const states = Object.entries(this.module.states ?? {});
    if (states.length === 0) return {};
    return { states: Object.fromEntries(states.map(([state, { below }]) => [state, below - 1])) };
  }
}
