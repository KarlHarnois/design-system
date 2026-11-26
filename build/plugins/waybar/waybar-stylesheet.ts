import type { BarSpec } from "../bar/bar-spec.ts";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import type { BarStyle } from "./bar-style.ts";
import { TintedImage } from "./tinted-image.ts";
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
      ...this.images(),
      this.moduleSpacing(),
      ...this.groupSpacing(),
      this.time(),
      this.lowBattery(),
      ...this.style.rules(),
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
  color: ${color(this.style.colors().text)};
}

#workspaces button:last-child {
  margin-right: 0;
}

#workspaces button.active {
  background: ${color(this.style.colors().marker)};
  color: ${color("color.text.inverse")};
}`;
  }

  private modules(): string {
    const selectors = this.spec
      .modules()
      .filter((module) => module.waybar !== WORKSPACES_MODULE && module.image === undefined)
      .map((module) => new WaybarModule(module).selector());
    return `${selectors.join(",\n")} {
  padding: 0 ${this.marker()};
}`;
  }

  private images(): string[] {
    return this.spec
      .modules()
      .map((module) => new WaybarModule(module))
      .flatMap((module) => (module.image === undefined ? [] : [this.image(module.selector(), module.image)]));
  }

  private image(selector: string, image: string): string {
    const height = this.theme.typography(BAR_TYPE_STYLE).fontSize.value;
    const width = height * new TintedImage(this.spec.imageSource(image)).aspectRatio();
    return `${selector} {
  min-width: ${Math.ceil(width)}px;
  background-image: url("${image}");
  background-size: ${Number(width.toFixed(2))}px ${height}px;
  background-position: left center;
  background-repeat: no-repeat;
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

  private groupSpacing(): string[] {
    const groups = [this.spec.left, this.spec.right].flatMap((side) =>
      side.slice(0, -1).map((group) => new WaybarGroup(group)),
    );
    const textGroups = groups.filter((group) => !group.endsWithImage);
    const imageGroups = groups.filter((group) => group.endsWithImage);
    return [this.marginRight(textGroups, "space.group"), this.marginRight(imageGroups, "space.cell")].filter(
      (rule) => rule !== undefined,
    );
  }

  private marginRight(groups: WaybarGroup[], spaceId: string): string | undefined {
    if (groups.length === 0) return undefined;
    return `${groups.map((group) => group.selector()).join(",\n")} {
  margin-right: ${this.theme.dimension(spaceId)};
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
  color: ${color(this.style.colors().emphasis)};
}`;
  }

  private lowBattery(): string {
    return `#battery.critical:not(.charging) {
  background: ${color(this.style.colors().marker)};
  color: ${color("color.text.inverse")};
}`;
  }

  private cell(): string {
    return this.theme.dimension("space.cell");
  }
}
