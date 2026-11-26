# 0021. Offer a borderless bar beside the floating bar

## Status
Accepted. Extends 0009.

## Context
The macOS 27 menu bar has no outline, no corners and no background of its own: the
wallpaper shows through behind its text. Some desktops read better with a bar like that
than with the floating bar of 0009, which sits inside the frame as one more container.

## Decision
- The bar has two styles, `floating` and `borderless`. `floating` stays the default and
  keeps every rule of 0009.
- `borderless` is transparent and draws no outline and no corner radius.
- Without an outline there is nothing for an inset to keep the markers clear of, so the
  bar is exactly `bar.line` tall, 16px, with no inset.
- It sits inside the frame like a row of windows: `space.frame` above it, one gutter below
  it. The first and last text sit on the left and right edges of the windows. Markers
  hang `space.marker` past the text into the frame, as hanging punctuation does, so an
  inverted workspace never pushes the text off the edge. With no marker showing, the
  marker padding would otherwise leave the text 4px short of the edge.
- Text keeps the theme's tokens: `color.text.secondary` for the modules and
  `color.text.primary` for the time. macOS draws menu bar text in its label colors,
  white at 85% and at 55% opacity in dark mode. Over black those come to about `#d9d9d9`
  and `#8c8c8c`, close to `color.text.primary` and `color.text.secondary`. Opaque tokens
  keep the bar the same colours as every other surface, whatever the wallpaper.
- Everything else is shared: the spec in `bar/bar.json`, the type, the markers and the
  spacing of modules and groups.

## Consequences
- The build writes each style to `waybar/<theme>/<style>/`. Each directory holds the same
  four files as before.
- The Home Manager module picks the style with `designSystem.waybar.style`.
- Hyprland's top gap stays one gutter in both styles.
- macOS switches its menu bar text between white and black to suit the wallpaper. The
  borderless bar cannot, so it needs a wallpaper that contrasts with the theme's text: dark
  for the dark theme, light for the light theme.
- The specimen previews both styles, with the sunken surface standing in for the wallpaper.
