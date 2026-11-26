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
- The clock never becomes a marker, so on the borderless bar it has no padding. The time
  then ends on the right edge of the windows, where padding would leave it 4px short.
- Every module, the time and the markers use one colour, `color.text.desktop`: white at
  84.7% opacity in the dark theme, black at 84.7% in the light theme. Text on a wallpaper
  has no surface to set a hierarchy against, so the bar uses one colour and lets the
  markers carry the emphasis. The slight transparency lets the wallpaper tint the text.
- The current workspace is underlined with a hairline in the bar's colour, as list
  matches are (0019), not filled. A fill was the heaviest thing on a bar of text on the
  wallpaper. No workspace becomes a marker, so workspaces have no padding, and the first
  digit sits on the window edge. They are `space.group` apart, two characters: wider than
  a word space, so each reads as its own item, and narrower than the 21px between wider
  items, which spread single digits too far apart.
  The underline is the bottom pixel of the 16px line, about 2px below the digits.
- A low battery is underlined the same way. Every marker on a bar shares the style's
  `marker`, `marker-text`, `marker-padding` and `marker-underline-width` tokens: a fill
  with the marker padding on the floating bar, an underline with no padding on the
  borderless bar.
- With no padding, the borderless bar's gaps come only from tokens, in two levels. Inside
  an item, the space between a label and its value and between the date and the time is
  one character, `space.cell`. Between items it is three cells, 21px: the style's
  `module-gap`, and its `group-gap`, which aliases it. At 7px against 21px, a label never
  reads as apart from its value. The spec marks the clock group as a `phrase`, whose
  modules stay `space.cell` apart in every style.
- Everything else is shared: the spec in `bar/bar.json`, the type, the markers and the
  spacing of modules and groups.

- Each style is a group of `component.bar-style.<style>` tokens with the same properties:
  outline, radius, padding, margins, Hyprland's window gap, plain padding and the bar's
  colours. The build reads every style from the tokens, so the floating and borderless
  bars differ only in token values. `tests/bar-tokens.test.ts` checks the arithmetic the
  borderless values rest on.
- A module that never becomes a marker says so in the spec with `"marker": false` and
  takes its style's `plain-padding`: the marker padding on the floating bar, none on the
  borderless bar. The clock is such a module.

## Consequences
- The build writes each style to `waybar/<theme>/<style>/`. Each directory holds the same
  four files as before.
- The Home Manager module picks the style with `designSystem.waybar.style`.
- Hyprland's top gap depends on the bar style: one gutter under the floating bar, 5px
  under the borderless bar. The build writes Hyprland settings per style to
  `hyprland/<theme>/<style>/`, and `designSystem.waybar.style` picks both.
- Translucent colours build as `rgba()` in the GTK stylesheet and the glossary, since GTK3
  does not read eight-digit hex. Opaque colours stay hex. Aliased colours build as GTK
  references, so a colour overridden in `designSystem.waybar.colors` reaches every token
  that aliases it.
- The specimen sets `--bar-style-*` from the style's tokens on each preview, so the
  preview CSS has no rules of its own per style.
- The bar cannot switch its text colour to suit the wallpaper, so it needs a wallpaper that
  contrasts with the theme: dark for the dark theme, light for the light theme.
- The specimen previews both styles. The borderless preview shows
  `specimen/wallpaper-dark.jpg` or `specimen/wallpaper-light.jpg` for the current theme
  when it exists, local files the repo ignores, and the sunken surface otherwise.
