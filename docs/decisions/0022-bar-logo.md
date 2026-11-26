# 0022. Start the borderless bar with the NixOS logo

## Status
Accepted. Extends 0011. The logo was later removed from the bar. Image modules, a
group's `styles` and `spaceAfter`, and `component.bar.image-height` stay in the spec for
the next image.

## Context
The desktop runs NixOS. The borderless bar had no mark for the system, and its first
workspace sat on the left edge of the windows only when it was the current one.

## Decision
- The bar spec gains image modules. A module with `image` names an SVG next to the spec,
  filled with `currentColor`, and Waybar draws it as a static `custom/<name>` module.
- A group can name the bar styles that show it with `styles`. Every style shows a group
  that names none.
- The first group, `system`, shows only on the borderless bar. The floating bar already
  marks its start with its outline and corner. The group holds one image module, the
  NixOS snowflake from `NixOS/nixos-artwork` (CC-BY 4.0), flattened to one solid fill.
- The SVG is cropped to the snowflake. The logo is `component.bar.image-height` tall,
  the bar's type size, 12px, and about 14px wide, centred on the 16px bar line. It has
  no marker padding, since it never becomes a marker, and it is pinned to the module's
  left edge, so its leftmost point is the left edge of the windows.
- `space.cell`, 7px, the gutter between windows, separates the logo from the first
  workspace's marker. The spec sets it on the group with `"spaceAfter": "space.cell"`;
  groups without one are `space.group` apart. The logo module is `"marker": false`.
- The build tints the SVG in the style's `text` colour for each theme.

## Consequences
- GTK draws the logo as the module's `background-image`, which resolves next to the
  stylesheet. The build writes the tinted SVG beside `style.css`, and the Home Manager
  module copies it to ~/.config/waybar.
- `designSystem.waybar.colors` does not reach the logo, since its colour is set at build.
- The specimen embeds each image as a data URL and masks it with the text colour.
