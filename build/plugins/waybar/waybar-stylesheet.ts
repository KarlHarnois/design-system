import type { BarSpec } from "../bar/bar-spec.ts";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import type { BarStyle } from "./bar-style.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";
import { WaybarGroup } from "./waybar-group.ts";
import { WaybarModule } from "./waybar-module.ts";

const color = GtkColorPalette.reference;
const BAR_TYPE_STYLE = "type.ui-small";
const WORKSPACES_MODULE = "hyprland/workspaces";

export class WaybarStylesheet {
  private readonly theme: ResolvedTheme;
  private readonly style: BarStyle;
  private readonly spec: BarSpec;

  constructor(theme: ResolvedTheme, style: BarStyle, spec: BarSpec) {
    this.theme = theme;
    this.style = style;
    this.spec = spec;
  }

  render(): string {
    return [
      `@import "colors.css";`,
      this.reset(),
      this.bar(),
      this.workspaces(),
      this.modules(),
      this.moduleSpacing(),
      this.groupSpacing(),
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
  min-height: ${this.theme.dimension("bar.line")};
}`;
  }

  private bar(): string {
    return `window#waybar {
  background: transparent;
}

window#waybar > box {
${this.style.boxDeclarations().map((declaration) => `  ${declaration}`).join("\n")}
}`;
  }

  private workspaces(): string {
    return `#workspaces button {
  padding: 0 ${this.marker()};
  min-width: ${this.markerContentMinWidth()}px;
  margin-right: ${this.marker()};
  background: transparent;
  color: ${color("color.text.secondary")};
}

#workspaces button:last-child {
  margin-right: 0;
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
  padding: 0 ${this.marker()};
}`;
  }

  private moduleSpacing(): string {
    const selectors = this.groups()
      .filter((group) => !group.isSingle)
      .flatMap((group) => group.modules.slice(0, -1).map((module) => module.selector()));
    return `${selectors.join(",\n")} {
  margin-right: ${this.cell()};
}`;
  }

  private groupSpacing(): string {
    const selectors = [this.spec.left, this.spec.right].flatMap((side) =>
      side.slice(0, -1).map((group) => new WaybarGroup(group).selector()),
    );
    return `${selectors.join(",\n")} {
  margin-right: ${this.theme.dimension("space.group")};
}`;
  }

  private groups(): WaybarGroup[] {
    return [...this.spec.left, ...this.spec.right].map((group) => new WaybarGroup(group));
  }

  private marker(): string {
    return this.theme.dimension("space.marker");
  }

  private markerContentMinWidth(): number {
    return this.theme.pixels("bar.line") - 2 * this.theme.pixels("space.marker");
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

  private cell(): string {
    return this.theme.dimension("space.cell");
  }
}
