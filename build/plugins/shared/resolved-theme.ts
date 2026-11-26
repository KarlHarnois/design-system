import type {
  Resolver,
  ResolverInput,
  TokenNormalized,
  TokenNormalizedSet,
  TypographyValueNormalized,
} from "@terrazzo/parser";
import { tokenToColor } from "@terrazzo/token-tools";
import Color from "colorjs.io";

const MILLISECONDS_PER_SECOND = 1000;
const OPAQUE = 1;
const MAX_CHANNEL = 255;
const GENERIC_FONT_FAMILIES = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"]);

export class ResolvedTheme {
  readonly name: string;
  private readonly input: ResolverInput;
  private readonly tokens: TokenNormalizedSet;

  constructor(input: ResolverInput, resolver: Resolver) {
    this.input = input;
    this.name = input.theme ?? resolver.inputDefault.theme;
    this.tokens = resolver.apply(input);
  }

  has(id: string): boolean {
    return id in this.tokens;
  }

  ids(): string[] {
    return Object.keys(this.tokens);
  }

  type(id: string): TokenNormalized["$type"] {
    return this.token(id).$type;
  }

  description(id: string): string | undefined {
    return this.token(id).$description;
  }

  directAlias(id: string): string | undefined {
    return this.token(id).aliasChain?.[0];
  }

  idsUnder(group: string): string[] {
    return Object.keys(this.tokens).filter((id) => id.startsWith(`${group}.`));
  }

  colorIds(): string[] {
    return Object.values(this.tokens)
      .filter((token) => token.$type === "color")
      .map((token) => token.id);
  }

  hex(id: string): string {
    return this.srgb(id).toString({ format: "hex", collapse: false });
  }

  cssColor(id: string): string {
    const srgb = this.srgb(id);
    if (srgb.alpha === OPAQUE) return this.hex(id);
    const [red, green, blue] = srgb.coords.map((channel) => Math.round((channel ?? 0) * MAX_CHANNEL));
    return `rgba(${red}, ${green}, ${blue}, ${srgb.alpha})`;
  }

  private srgb(id: string): Color {
    const token = this.tokenOfType(id, "color");
    return new Color(tokenToColor(token.$value)).to("srgb").toGamut();
  }

  dimension(id: string): string {
    const { value, unit } = this.tokenOfType(id, "dimension").$value;
    return `${value}${unit}`;
  }

  pixels(id: string): number {
    const { value, unit } = this.tokenOfType(id, "dimension").$value;
    if (unit !== "px") throw new Error(`Token "${id}" is ${value}${unit}, but this target needs pixels`);
    return value;
  }

  milliseconds(id: string): number {
    const { value, unit } = this.tokenOfType(id, "duration").$value;
    return unit === "s" ? value * MILLISECONDS_PER_SECOND : value;
  }

  fontFamily(id: string): string {
    return ResolvedTheme.cssFontFamily(this.fontFamilyNames(id));
  }

  static cssFontFamily(names: string[]): string {
    return names.map((family) => ResolvedTheme.quoteFontFamily(family)).join(", ");
  }

  fontFamilyNames(id: string): string[] {
    return this.tokenOfType(id, "fontFamily").$value;
  }

  fontWeight(id: string): number {
    return this.tokenOfType(id, "fontWeight").$value;
  }

  number(id: string): number {
    return this.tokenOfType(id, "number").$value;
  }

  typography(id: string): TypographyValueNormalized {
    return this.tokenOfType(id, "typography").$value;
  }

  private static quoteFontFamily(family: string): string {
    return GENERIC_FONT_FAMILIES.has(family) ? family : `"${family}"`;
  }

  private token(id: string): TokenNormalized {
    const token = this.tokens[id];
    if (!token) throw new Error(`Tokens for ${JSON.stringify(this.input)} have no token "${id}"`);
    return token;
  }

  private tokenOfType<T extends TokenNormalized["$type"]>(id: string, type: T): Extract<TokenNormalized, { $type: T }> {
    const token = this.tokens[id];
    if (token?.$type !== type) {
      throw new Error(`Tokens for ${JSON.stringify(this.input)} have no ${type} token "${id}"`);
    }
    return token as Extract<TokenNormalized, { $type: T }>;
  }
}
