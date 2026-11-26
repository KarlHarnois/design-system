# 0021. Offer a borderless bar beside the floating bar

## Status
Accepted. Extends 0009.

## Context
The floating bar of 0009 sits inside the frame as one more container, with a background,
an outline and corners. Some desktops read better with a bar that draws none of those, so
its text sits straight on the wallpaper.

## Decision
- The bar has two styles, `floating` and `borderless`. `floating` stays the default and
  keeps every rule of 0009.
- `borderless` is transparent and draws no outline and no corner radius.
- Without an outline there is nothing for an inset to keep the markers clear of, so the
  bar is exactly `bar.line` tall, 16px, with no inset.
- The windows start the floating bar's height, 26px, below the top of the screen. The text
  sits centred in that space, as it sits in the floating bar: `border.width.default` +
  `space.inset`, 5px, above the text and the same below it.
- Waybar reserves the 5px margin and the 16px line. Hyprland's top gap is the other 5px,
  so 5 + 16 + 5 = 26.
- On the left and right it sits inside the frame like a row of windows. The current
  workspace's marker starts on the left edge of the windows.
- The clock never becomes a marker, so its modules drop the marker padding. The time
  then ends on the right edge of the windows, where padding would leave it 4px short.
- Every module, the time and the markers use one colour, `color.text.desktop`: white at
  84.7% opacity in the dark theme, black at 84.7% in the light theme. Text on a wallpaper
  has no surface to set a hierarchy against, so the bar uses one colour and lets the
  markers carry the emphasis. The slight transparency lets the wallpaper tint the text.
- Everything else is shared: the spec in `bar/bar.json`, the type, the markers and the
  spacing of modules and groups.

## Consequences
- The build writes each style to `waybar/<theme>/<style>/`. Each directory holds the same
  four files as before.
- The Home Manager module picks the style with `designSystem.waybar.style`.
- Hyprland's top gap depends on the bar style: one gutter under the floating bar, 5px
  under the borderless bar. The build writes Hyprland settings per style to
  `hyprland/<theme>/<style>/`, and `designSystem.waybar.style` picks both.
- Translucent colours build as `rgba()` in the GTK stylesheet and the glossary, since GTK3
  does not read eight-digit hex.
- The bar cannot switch its text colour to suit the wallpaper, so it needs a wallpaper that
  contrasts with the theme: dark for the dark theme, light for the light theme.
- The specimen previews both styles. The borderless preview shows
  `specimen/wallpaper-dark.jpg` or `specimen/wallpaper-light.jpg` for the current theme
  when it exists, local files the repo ignores, and the sunken surface otherwise.
