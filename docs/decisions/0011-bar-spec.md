# 0011. Describe the bar once in a spec

## Status
Accepted. Changes 0009.

## Context
The specimen preview and the Waybar config described the bar separately and drifted.
The preview dropped the submap and the window title, the config still had them.

## Decision
- `bar/bar.json` is the single source for the bar. It lists the modules on each side in
  order, with the Waybar module name, format, fixed width in characters, alignment,
  format variants and states. `bar/bar.schema.json` describes it, and a test validates it.
- The build generates the Waybar `config.jsonc` and the module styles from the spec,
  and writes it to `dist/bar/bar.js` for the specimen preview.
- Fixed width: a label and its value stay one space apart, as `vol 40%`. The width
  comes from a minimum width with right alignment, so the padding falls before the label,
  in the gap between modules. Waybar uses `min-length` and `align`, which set the GTK
  label's width in characters and its alignment. The web uses `min-width` in `ch` with
  right-aligned text. Muted volume, `vol ---`, and charging, `chg 82%`, follow the same rule.
- The bar has no submap and no window title, as in the preview.

## The mode rule
Principle 1 says the current mode is always visible, named in the status bar. The desktop
uses no Hyprland submaps, so it has no mode to name, and the bar needs no submap module.
If a submap is ever added, the `hyprland/submap` module goes back in the spec, inverted
like the current workspace.
