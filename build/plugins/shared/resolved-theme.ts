import type { Resolver, ResolverInput, TokenNormalized, TokenNormalizedSet } from "@terrazzo/parser";
import { tokenToColor } from "@terrazzo/token-tools";
import Color from "colorjs.io";

const GENERIC_FONT_FAMILIES = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"]);

export class ResolvedTheme {
  readonly name: string;
  private readonly input: ResolverInput;
  private readonly tokens: TokenNormalizedSet;

  constructor(input: ResolverInput, resolver: Resolver) {
    this.input = input;
    this.name = input.theme;
    this.tokens = resolver.apply(input);
  }

  colorIds(): string[] {
    return Object.values(this.tokens)
      .filter((token) => token.$type === "color")
      .map((token) => token.id);
  }

  hex(id: string): string {
    const token = this.tokenOfType(id, "color");
    const srgb = new Color(tokenToColor(token.$value)).to("srgb").toGamut();
    return srgb.toString({ format: "hex", collapse: false });
  }

  dimension(id: string): string {
    const { value, unit } = this.tokenOfType(id, "dimension").$value;
    return `${value}${unit}`;
  }

  fontFamily(id: string): string {
    const families = this.tokenOfType(id, "fontFamily").$value;
    return families.map((family) => ResolvedTheme.quoteFontFamily(family)).join(", ");
  }

  private static quoteFontFamily(family: string): string {
    return GENERIC_FONT_FAMILIES.has(family) ? family : `"${family}"`;
  }

  private tokenOfType<T extends TokenNormalized["$type"]>(id: string, type: T): Extract<TokenNormalized, { $type: T }> {
    const token = this.tokens[id];
    if (token?.$type !== type) {
      throw new Error(`Tokens for ${JSON.stringify(this.input)} have no ${type} token "${id}"`);
    }
    return token as Extract<TokenNormalized, { $type: T }>;
  }
}
