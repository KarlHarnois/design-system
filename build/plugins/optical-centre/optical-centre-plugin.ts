import type { BuildHookOptions, Plugin } from "@terrazzo/parser";
import { GridFont } from "../knave-grid/grid-font.ts";
import { GridTypeStyle } from "../knave-grid/grid-type-style.ts";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import type { FontMetricsSource } from "./font-metrics.ts";
import { OpticalShift } from "./optical-shift.ts";
import { ChromiumRenderer, PangoRenderer, type TextRenderer } from "./text-renderer.ts";

const TYPE_GROUP = "type";
const ONE_LINE_TOKEN = "space.line";
const LINE_TOLERANCE_PX = 0.01;
const DESCRIPTION =
  "Pixels to move the text of each one-line type style down (negative is up) so its letters look centred. A hook for later: no target applies it yet. See docs/decisions/0010-optical-centring.md.";

type ShiftJson = { exact: number; pixels: number };

export class OpticalCentrePlugin implements Plugin {
  readonly name = "optical-centre";
  private readonly fonts: FontMetricsSource;
  private readonly renderers: TextRenderer[] = [new ChromiumRenderer(), new PangoRenderer()];

  constructor(fonts: FontMetricsSource) {
    this.fonts = fonts;
  }

  build({ resolver, outputFile }: BuildHookOptions): void {
    const tokens = new ResolvedTheme(resolver.inputDefault, resolver);
    const styles = this.oneLineStyles(tokens);
    const targets = Object.fromEntries(this.renderers.map((renderer) => [renderer.target, this.shifts(renderer, styles)]));
    outputFile("optical-centre.json", `${JSON.stringify({ $description: DESCRIPTION, ...targets }, null, 2)}\n`);
  }

  private oneLineStyles(tokens: ResolvedTheme): GridTypeStyle[] {
    const linePx = tokens.pixels(ONE_LINE_TOKEN);
    return tokens
      .idsUnder(TYPE_GROUP)
      .filter((id) => id.split(".").length === 2)
      .map((id) => new GridTypeStyle(id, tokens.typography(id)))
      .filter((style) => Math.abs(style.leadingPx - linePx) < LINE_TOLERANCE_PX);
  }

  private shifts(renderer: TextRenderer, styles: GridTypeStyle[]): { [style: string]: ShiftJson } {
    return Object.fromEntries(styles.map((style) => [style.name, this.shift(renderer, style)]));
  }

  private shift(renderer: TextRenderer, style: GridTypeStyle): ShiftJson {
    const metrics = this.fonts.metrics(GridFont.fileName(style.fontFamily[0], style.weight));
    const shift = new OpticalShift(renderer, metrics, style.sizePx, style.leadingPx);
    return { exact: Number(shift.exact.toFixed(3)), pixels: shift.pixels };
  }
}
