# 0021. Offer a borderless bar beside the floating bar

## Status
Accepted. Extends 0009.

## Context
The macOS 27 menu bar runs the full width of the screen, flush with the top edge, with no
outline and no corners. Some desktops read better with a bar like that than with the
floating bar of 0009, which sits inside the frame as one more container.

## Decision
- The bar has two styles, `floating` and `borderless`. `floating` stays the default and
  keeps every rule of 0009.
- `borderless` runs flush along the top, left and right edges of the screen, with no
  frame margin, no outline and no corner radius.
- Its height is `bar.line` plus `space.inset` above and below, 24px, the height of the
  macOS menu bar.
- Its horizontal padding is `space.frame` + `border.width.default` + `space.inset`, 12px.
  The modules then sit in the same columns as in the floating bar, so switching styles
  moves nothing on the left or right.
- Everything else is shared: the spec in `bar/bar.json`, the type, the colours, the
  markers and the spacing of modules and groups.

## Consequences
- The build writes each style to `waybar/<theme>/<style>/`. Each directory holds the same
  four files as before.
- The Home Manager module picks the style with `designSystem.waybar.style`.
- Hyprland's top gap stays one gutter. The floating bar's exclusive zone covers its frame
  margin, so in both styles one gutter separates the bar from the windows.
- The specimen previews both styles.
