import type { ResolvedTheme } from "../shared/resolved-theme.ts";

const GRAYS_FOR_BASE00_TO_BASE07 = {
  dark: ["950", "900", "800", "600", "400", "200", "100", "50"],
  light: ["0", "50", "100", "500", "600", "800", "900", "950"],
} as const;
const SYNTAX_GRAYS_FOR_BASE08_TO_BASE0F = {
  dark: ["500", "400", "400", "400", "500", "600", "500", "600"],
  light: ["500", "600", "600", "600", "500", "400", "500", "400"],
} as const;

type Variant = keyof typeof GRAYS_FOR_BASE00_TO_BASE07;

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
    return SYNTAX_GRAYS_FOR_BASE08_TO_BASE0F[this.variant].map((step) => `color.gray.${step}`);
  }

  private static slotName(slot: number): string {
    return `base${slot.toString(16).toUpperCase().padStart(2, "0")}`;
  }

  private static variantOf(themeName: string): Variant {
    if (themeName in GRAYS_FOR_BASE00_TO_BASE07) return themeName as Variant;
    const variants = Object.keys(GRAYS_FOR_BASE00_TO_BASE07).join(", ");
    throw new Error(`Base16 has no variant for theme "${themeName}". Expected one of: ${variants}`);
  }
}
