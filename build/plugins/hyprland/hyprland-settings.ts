import type { ResolvedTheme } from "../shared/resolved-theme.ts";

const CURVE_NAME = "ease-out";
const CSS_EASE_OUT_POINTS = [
  [0, 0],
  [0.58, 1],
];
const MILLISECONDS_PER_HYPRLAND_SPEED_UNIT = 100;
const INSTANT_LEAVES = ["windows", "workspaces", "border"];
const ANIMATED_LEAVES = ["fade", "windowsMove"];
const OPEN_AND_CLOSE_LEAVES = ["windowsIn", "windowsOut", "fadeIn", "fadeOut"];

export type LuaValue = string | number | boolean | LuaValue[] | { [key: string]: LuaValue };

export type HyprlandSettingsJson = {
  curve: { _args: LuaValue[] }[];
  config: { [section: string]: LuaValue };
  animation: { [field: string]: LuaValue }[];
};

export class HyprlandSettings {
  private readonly theme: ResolvedTheme;

  constructor(theme: ResolvedTheme) {
    this.theme = theme;
  }

  toJSON(): HyprlandSettingsJson {
    return { curve: [this.curve()], config: this.config(), animation: this.animations() };
  }

  private curve(): { _args: LuaValue[] } {
    return { _args: [CURVE_NAME, { type: "bezier", points: CSS_EASE_OUT_POINTS }] };
  }

  private config(): { [section: string]: LuaValue } {
    return {
      general: {
        gaps_in: this.gapsIn(),
        gaps_out: this.gapsOut(),
        border_size: this.theme.pixels("border.width.default"),
        col: {
          active_border: this.color("color.focus"),
          inactive_border: this.color("color.border.default"),
        },
      },
      decoration: { rounding: this.theme.pixels("radius.container") },
      animations: { enabled: true },
    };
  }

  private gapsOut(): { [side: string]: number } {
    const frame = this.theme.pixels("space.frame");
    const gutterBelowFloatingBar = this.theme.pixels("space.cell");
    return { top: gutterBelowFloatingBar, right: frame, bottom: frame, left: frame };
  }

  private gapsIn(): { [side: string]: number } {
    const gutter = this.theme.pixels("space.cell");
    const leadingSide = Math.floor(gutter / 2);
    const trailingSide = gutter - leadingSide;
    return { top: leadingSide, right: trailingSide, bottom: trailingSide, left: leadingSide };
  }

  private animations(): { [field: string]: LuaValue }[] {
    const speed = this.theme.milliseconds("duration.quick") / MILLISECONDS_PER_HYPRLAND_SPEED_UNIT;
    return [
      ...INSTANT_LEAVES.map((leaf) => ({ leaf, enabled: false })),
      ...ANIMATED_LEAVES.map((leaf) => ({ leaf, enabled: true, speed, bezier: CURVE_NAME })),
      ...OPEN_AND_CLOSE_LEAVES.map((leaf) => ({ leaf, enabled: false })),
    ];
  }

  private color(id: string): string {
    return `rgb(${this.theme.hex(id).slice(1)})`;
  }
}
