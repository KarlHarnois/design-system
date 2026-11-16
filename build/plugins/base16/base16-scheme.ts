import type { ResolvedTheme } from "../shared/resolved-theme.ts";

const GRAYS_FOR_BASE00_TO_BASE07 = {
  dark: ["950", "900", "800", "600", "400", "200", "100", "50"],
  light: ["0", "50", "100", "500", "600", "800", "900", "950"],
} as const;
const SYNTAX_SHADE = { dark: "400", light: "500" } as const;
const SYNTAX_HUES_FOR_BASE08_TO_BASE0F = ["red", "yellow", "yellow", "green", "blue", "blue", "red", "yellow"];

type Variant = keyof typeof SYNTAX_SHADE;

export class Base16Scheme {
  private readonly theme: ResolvedTheme;
  private readonly variant: Variant;

  constructor(theme: ResolvedTheme) {
    this.theme = theme;
    this.variant = Base16Scheme.variantOf(theme.name);
  }

  render(): string {
    const palette = this.slotTokenIds().map((tokenId, slot) => `  ${Base16Scheme.slotName(slot)}: "${this.theme.hex(tokenId)}"`);
    return [`system: "base16"`, `name: "Design System ${this.theme.name}"`, `variant: "${this.variant}"`, "palette:", ...palette]
      .join("\n")
      .concat("\n");
  }

  private slotTokenIds(): string[] {
    return [...this.grayTokenIds(), ...this.syntaxTokenIds()];
  }

  private grayTokenIds(): string[] {
    return GRAYS_FOR_BASE00_TO_BASE07[this.variant].map((step) => `color.gray.${step}`);
  }

  private syntaxTokenIds(): string[] {
    return SYNTAX_HUES_FOR_BASE08_TO_BASE0F.map((hue) => `color.${hue}.${SYNTAX_SHADE[this.variant]}`);
  }

  private static slotName(slot: number): string {
    return `base${slot.toString(16).toUpperCase().padStart(2, "0")}`;
  }

  private static variantOf(themeName: string): Variant {
    if (themeName in SYNTAX_SHADE) return themeName as Variant;
    throw new Error(`Base16 has no variant for theme "${themeName}". Expected one of: ${Object.keys(SYNTAX_SHADE).join(", ")}`);
  }
}
