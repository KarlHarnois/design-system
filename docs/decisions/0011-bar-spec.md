# 0011. Describe the bar once in a spec

## Status
Accepted. Changes 0009.

## Context
The specimen preview and the Waybar config described the bar separately and drifted.
The preview dropped the submap and the window title, the config still had them.

## Decision
- `bar/bar.json` is the single source for the bar. It lists the groups on each side in
  order, and the modules in each group, with the Waybar module name, format, fixed width
  in characters, alignment, format variants and states. A state can carry its own format.
- Groups become Waybar `group/<name>` modules laid out in a row. A group of one module
  stays a plain module. `bar/bar.schema.json` describes it, and a test validates it.
- The build generates the Waybar `config.jsonc` and the module styles from the spec,
  and writes it to `dist/bar/bar.js` for the specimen preview.
- Fixed width: a label and its value stay one space apart, as `vol 40%`. The width
  comes from a minimum width with right alignment, so the padding falls before the label,
  in the gap between modules. Waybar uses `min-length` and `align`, which set the GTK
  label's width in characters and its alignment. The web uses `min-width` in `ch` with
  right-aligned text. Muted volume, `vol ---`, and charging, `chg 82%`, follow the same rule.
- Volume and battery are 7 characters wide, exact for 0 to 99%. At 100% they grow by one
  character and the modules to their left move by one character. That is accepted.
- Low battery inverts only the text and its 7px padding. Pango markup in `format-critical`
  would render, but a span's background covers only the glyphs, not the label's padding.
  So the critical format zero-pads the value instead, as `bat 05%`, which fills the 7
  characters exactly.
- Ligatures stay on. Muted volume draws `---` as one line by design. Iosevka's ligatures
  keep the width of the characters they replace, so fixed widths still hold.
- The bar has no submap and no window title, as in the preview.

## The mode rule
Principle 1 says the current mode is always visible, named in the status bar. The desktop
uses no Hyprland submaps, so it has no mode to name, and the bar needs no submap module.
If a submap is ever added, the `hyprland/submap` module goes back in the spec, inverted
like the current workspace.
