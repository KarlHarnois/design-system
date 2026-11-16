# 0006. Start black and white

## Status
Accepted

## Context
The accent menu and the mode colors added hue before the type, grid and components
were settled. A monochrome system shows whether hierarchy holds up through size,
weight and position alone, the way Swiss typography and Vercel's Geist start from neutrals.

## Decision
- Remove the `accent` resolver modifier, the `tokens/accent/` files, `color.accent` and `mode.*`.
- `color.focus` aliases `color.text.primary`: white on dark, black on light.
- Emphasis uses inversion. Primary buttons, the status bar mode and the table cursor
  draw `color.text.inverse` on `color.focus`.
- The status bar names the current mode, so modes stay distinguishable without color.
- The primitive hue ramps stay, because base16 needs them for terminal syntax colors.

## Consequences
Targets build one output per theme. Waybar styles move from `waybar/<theme>/<accent>/`
to `waybar/<theme>/`, and the Home Manager module drops its `accent` option.
Adding an accent later means a new resolver modifier that overrides `color.focus`.
