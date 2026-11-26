import type { BarSpec } from "../bar/bar-spec.ts";
import type { BarStyle } from "../bar/bar-style.ts";
import { SvgImage } from "../bar/svg-image.ts";
import { ResolvedTheme } from "../shared/resolved-theme.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";
import { WaybarGroup } from "./waybar-group.ts";
import { WaybarModule } from "./waybar-module.ts";

const color = GtkColorPalette.reference;
const BAR_TYPE_STYLE = "type.ui-small";

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
      ...this.modulePadding(),
      ...this.images(),
      this.moduleSpacing(),
      ...this.groupSpacing(),
      this.time(),
      this.lowBattery(),
    ]
      .filter((rule) => rule !== undefined)
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
  background-color: ${this.color("background")};
  color: ${this.color("text")};
  border: ${this.style.pixels("outline-width")}px solid ${this.color("outline")};
  border-radius: ${this.style.pixels("radius")}px;
  padding: ${this.style.pixels("padding")}px;
}`;
  }

  private workspaces(): string {
    const padding = this.style.pixels("marker-padding");
    return `#workspaces button {
  padding: 0 ${padding}px;
  min-width: ${Math.max(0, this.style.pixels("workspace-width") - 2 * padding)}px;
  margin-right: ${this.style.pixels("workspace-gap")}px;
  background: transparent;
  color: ${this.color("text")};
}

#workspaces button:last-child {
  margin-right: 0;
}

#workspaces button.active {
${this.markerDeclarations()}
}`;
  }

  private modulePadding(): (string | undefined)[] {
    const modules = this.textModules();
    return [
      this.ruleFor(modules.filter((module) => module.isMarker), `padding: 0 ${this.style.pixels("marker-padding")}px;`),
      this.ruleFor(modules.filter((module) => !module.isMarker), `padding: 0 ${this.style.pixels("plain-padding")}px;`),
    ];
  }

  private images(): string[] {
    return this.modules().flatMap((module) => (module.image === undefined ? [] : [this.image(module, module.image)]));
  }

  private image(module: WaybarModule, image: string): string {
    const height = this.theme.pixels("component.bar.image-height");
    const width = height * new SvgImage(this.spec.imageSource(image)).aspectRatio();
    return `${module.selector()} {
  min-width: ${Math.ceil(width)}px;
  background-image: url("${image}");
  background-size: ${Number(width.toFixed(2))}px ${height}px;
  background-position: left center;
  background-repeat: no-repeat;
}`;
  }

  private moduleSpacing(): string | undefined {
    const modules = this.groups()
      .filter((group) => !group.isSingle)
      .flatMap((group) => group.modules.slice(0, -1));
    return this.ruleFor(modules, `margin-right: ${this.theme.dimension("space.cell")};`);
  }

  private groupSpacing(): string[] {
    const groups = [this.spec.left, this.spec.right].flatMap((side) =>
      side.slice(0, -1).map((group) => new WaybarGroup(group)),
    );
    return groups.map((group) => `${group.selector()} {
  margin-right: ${this.theme.dimension(group.spaceAfter)};
}`);
  }

  private time(): string {
    return `#clock.time {
  color: ${this.color("emphasis")};
}`;
  }

  private lowBattery(): string {
    return `#battery.critical:not(.charging) {
${this.markerDeclarations()}
}`;
  }

  private ruleFor(modules: WaybarModule[], declaration: string): string | undefined {
    if (modules.length === 0) return undefined;
    return `${modules.map((module) => module.selector()).join(",\n")} {
  ${declaration}
}`;
  }

  private textModules(): WaybarModule[] {
    return this.modules().filter((module) => !module.isWorkspaces && module.image === undefined);
  }

  private modules(): WaybarModule[] {
    return this.spec.modules().map((module) => new WaybarModule(module));
  }

  private groups(): WaybarGroup[] {
    return [...this.spec.left, ...this.spec.right].map((group) => new WaybarGroup(group));
  }

  private color(property: string): string {
    return color(this.style.tokenId(property));
  }

  private markerDeclarations(): string {
    const underline = this.style.pixels("marker-underline-width");
    return [
      `background: ${this.color("marker")};`,
      `color: ${this.color("marker-text")};`,
      `box-shadow: inset 0 -${underline}px ${this.color("marker-text")};`,
    ]
      .map((declaration) => `  ${declaration}`)
      .join("\n");
  }
}
