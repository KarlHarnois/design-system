import type { ResolvedTheme } from "../shared/resolved-theme.ts";
import { GtkColorPalette } from "./gtk-color-palette.ts";

const color = GtkColorPalette.reference;

export class WaybarStylesheet {
  private readonly theme: ResolvedTheme;

  constructor(theme: ResolvedTheme) {
    this.theme = theme;
  }

  render(): string {
    return [`@import "colors.css";`, this.reset(), this.bar(), this.workspaces(), this.modeIndicator(), this.modules()]
      .join("\n\n")
      .concat("\n");
  }

  private reset(): string {
    return `* {
  font-family: ${this.theme.fontFamily("font.family.mono")};
  font-size: ${this.theme.dimension("font.size.body")};
  min-height: 0;
  border: none;
  border-radius: 0;
}`;
  }

  private bar(): string {
    return `window#waybar {
  min-height: ${this.theme.dimension("bar.height")};
  background-color: ${color("color.surface.base")};
  color: ${color("color.text.primary")};
}`;
  }

  private workspaces(): string {
    return `#workspaces button {
  padding: 0 ${this.cell()};
  color: ${color("color.text.secondary")};
  background: transparent;
}

#workspaces button.active,
#workspaces button.focused {
  color: ${color("color.text.primary")};
  box-shadow: inset 0 -${this.theme.dimension("focus.width")} ${color("color.focus")};
}

#workspaces button.urgent {
  background-color: ${color("color.text.primary")};
  color: ${color("color.text.inverse")};
}`;
  }

  private modeIndicator(): string {
    return `#mode,
#submap {
  padding: 0 ${this.cell()};
  background-color: ${color("color.text.primary")};
  color: ${color("color.text.inverse")};
}`;
  }

  private modules(): string {
    return `.modules-left > widget > *,
.modules-center > widget > *,
.modules-right > widget > * {
  padding: 0 ${this.cell()};
}`;
  }

  private cell(): string {
    return this.theme.dimension("space.cell");
  }
}
