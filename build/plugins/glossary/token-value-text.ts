import type { ResolvedTheme } from "../shared/resolved-theme.ts";

type ValueFormatter = (theme: ResolvedTheme, id: string) => string;

export class TokenValueText {
  private static readonly FORMATTERS: Record<string, ValueFormatter> = {
    color: (theme, id) => theme.hex(id),
    dimension: (theme, id) => theme.dimension(id),
    duration: (theme, id) => `${theme.milliseconds(id)}ms`,
    number: (theme, id) => String(theme.number(id)),
    fontFamily: (theme, id) => theme.fontFamily(id),
    fontWeight: (theme, id) => String(theme.fontWeight(id)),
    typography: (theme, id) => TokenValueText.typography(theme, id),
  };

  private readonly theme: ResolvedTheme;

  constructor(theme: ResolvedTheme) {
    this.theme = theme;
  }

  of(id: string): string {
    const type = this.theme.type(id);
    const formatter = TokenValueText.FORMATTERS[type];
    if (!formatter) throw new Error(`The glossary cannot show ${type} tokens such as "${id}"`);
    return formatter(this.theme, id);
  }

  private static typography(theme: ResolvedTheme, id: string): string {
    const { fontSize, lineHeight, fontWeight, fontFamily } = theme.typography(id);
    const size = `${fontSize.value}${fontSize.unit}`;
    const line = typeof lineHeight === "number" ? String(lineHeight) : `${lineHeight.value}${lineHeight.unit}`;
    return `${size}/${line} ${fontFamily[0]} ${fontWeight}`;
  }
}
