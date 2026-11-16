# 0008. Space the desktop in cells

## Status
Accepted. Refines 0003.

## Context
Principle 3 makes every vertical space a whole number of lines. That keeps text on
the baseline grid, but it would make every desktop gap at least 21px. Window gaps,
the outer frame and insets hold no text, so they need their own rule.

## Decision
- Text inside containers follows the baseline grid.
- Desktop spacing uses cells in both directions: window gaps, the outer frame and insets.
- The gutter between windows is 1 cell (7px). The outer frame is 2 cells (14px).
- The frame and gutters are the same on every monitor. Window contents absorb leftover pixels.
- Window borders are 1px (`dimension.hairline`). The focused window's border is
  `color.focus`, the others use `color.border.default`. So exactly one full contrast
  outline shows where keys go.
- Containers (windows, the bar, popups) have a 4px radius. Content inside them stays square.
- Only fades and window moves animate, at `duration.quick`. Opening, closing, focus
  changes and workspace switches are instant.

## Consequences
- Hyprland 0.55 and later read Lua. The Hyprland target writes `theme.lua` and a
  `settings.json` for Home Manager's Lua settings.
- Hyprland applies `gaps_in` to each window, so two neighbours add their gaps. The
  target sets 3px on the top and left and 4px on the bottom and right, so every gutter
  is exactly 7px. `gaps_out` is the frame on the right, bottom and left. Its top is
  one gutter, because the floating bar already holds the frame above it. See 0009.
- Hyprland measures animation speed in tenths of a second, so `duration.quick` is speed 1.
- The `border` animation is off too, so the focus outline moves without a fade.
- `fadeIn` and `fadeOut` sit under `fade`, so a window still fades in over 100ms as it opens.
- The Home Manager module reads `settings.json` from the built package, which is
  import from derivation.
