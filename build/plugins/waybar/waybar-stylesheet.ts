import type { BarSpec } from "../bar/bar-spec.ts";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";
import { WaybarModule } from "./waybar-module.ts";

const color = GtkColorPalette.reference;
const BAR_TYPE_STYLE = "type.ui-small";
const WORKSPACES_MODULE = "hyprland/workspaces";

export class WaybarStylesheet {
  private readonly theme: ResolvedTheme;
  private readonly spec: BarSpec;

  constructor(theme: ResolvedTheme, spec: BarSpec) {
    this.theme = theme;
    this.spec = spec;
  }

  render(): string {
    return [
      `@import "colors.css";`,
      this.reset(),
      this.bar(),
      this.workspaces(),
      this.modules(),
      this.time(),
      this.lowBattery(),
    ]
      .join("\n\n")
      .concat("\n");
  }

  private reset(): string {
    const { fontFamily, fontSize } = this.theme.typography(BAR_TYPE_STYLE);
    return `* {
  font-family: ${ResolvedTheme.cssFontFamily([fontFamily].flat())};
  font-size: ${fontSize.value}${fontSize.unit};
  min-height: 0;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
  text-shadow: none;
}

label,
button {
  min-height: ${this.lineHeight()};
}`;
  }

  private bar(): string {
    return `window#waybar {
  background: transparent;
}

window#waybar > box {
  background-color: ${color("color.surface.base")};
  color: ${color("color.text.secondary")};
  border: ${this.theme.dimension("border.width.default")} solid ${color("color.border.default")};
  border-radius: ${this.theme.dimension("radius.container")};
  padding: ${this.theme.dimension("space.inset")};
}`;
  }

  private workspaces(): string {
    return `#workspaces button {
  padding: 0 ${this.cell()};
  background: transparent;
  color: ${color("color.text.secondary")};
}

#workspaces button.active {
  background: ${color("color.focus")};
  color: ${color("color.text.inverse")};
}`;
  }

  private modules(): string {
    const selectors = this.spec
      .modules()
      .filter((module) => module.waybar !== WORKSPACES_MODULE)
      .map((module) => new WaybarModule(module).selector());
    return `${selectors.join(",\n")} {
  padding: 0 ${this.cell()};
}`;
  }

  private time(): string {
    return `#clock.time {
  color: ${color("color.text.primary")};
}`;
  }

  private lowBattery(): string {
    return `#battery.critical:not(.charging) {
  background: ${color("color.focus")};
  color: ${color("color.text.inverse")};
}`;
  }

  private lineHeight(): string {
    const { fontSize, lineHeight } = this.theme.typography(BAR_TYPE_STYLE);
    return `${Math.round(fontSize.value * Number(lineHeight))}${fontSize.unit}`;
  }

  private cell(): string {
    return this.theme.dimension("space.cell");
  }
}
