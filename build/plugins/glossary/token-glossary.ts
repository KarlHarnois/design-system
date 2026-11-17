import type { ResolvedTheme } from "../shared/resolved-theme.ts";
import { TokenValueText } from "./token-value-text.ts";

export interface GlossaryEntry {
  id: string;
  type: string;
  cssVariable: string;
  aliasOf: string | undefined;
  description: string | undefined;
  values: Record<string, string>;
}

export class TokenGlossary {
  private readonly themes: ResolvedTheme[];

  constructor(themes: ResolvedTheme[]) {
    this.themes = themes;
  }

  entries(): GlossaryEntry[] {
    const [defaultTheme] = this.themes;
    if (!defaultTheme) throw new Error("The glossary needs at least one theme");
    return defaultTheme.ids().toSorted(TokenGlossary.naturalOrder).map((id) => this.entry(defaultTheme, id));
  }

  private static naturalOrder(one: string, other: string): number {
    return one.localeCompare(other, "en", { numeric: true });
  }

  private entry(defaultTheme: ResolvedTheme, id: string): GlossaryEntry {
    return {
      id,
      type: defaultTheme.type(id),
      cssVariable: `--${id.replaceAll(".", "-")}`,
      aliasOf: defaultTheme.directAlias(id),
      description: defaultTheme.description(id),
      values: Object.fromEntries(this.themes.map((theme) => [theme.name, new TokenValueText(theme).of(id)])),
    };
  }
}
