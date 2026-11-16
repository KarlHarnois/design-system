# 0013. Three button variants with states, sizes and an icon-only shape

## Status
Accepted. Builds on 0006 and 0012.

## Context
Buttons had a primary and a secondary look and a focus outline, and nothing else. A desktop
app needs buttons for the main action, other actions and dense toolbars, with hover,
pressed and disabled states. The system is black and white, so variants cannot use hue.
Apple's bezeled and borderless buttons and GitHub Primer's default and invisible buttons
use the same split.

## Decision
- Three variants, one shape. All are one line tall with `space.control` at the sides.
  - Primary is inverted: `color.text.primary` behind `color.text.inverse`. One per view.
  - Secondary is a 1px outline in `color.border.default`, drawn inside the button.
  - Plain is text only, for toolbars and dense rows.
- States come from a `color.fill` group in each theme:
  - Strong hover and pressed fills for primary, two and three steps down the gray ramp in
    the dark theme, one and two steps in the light theme.
  - Subtle hover and pressed fills for secondary and plain: the raised surface and the
    selection gray.
- Hover applies only where a pointer can hover. Pressed follows `:active` and also shows
  for `duration.quick` when `<CR>` presses a button.
- Disabled uses `aria-disabled`, not `disabled`, so the button stays focusable and the
  keyboard can still find it. Its text turns `color.text.secondary`; primary loses its fill.
- Small buttons sit on the 16px bar line in `type.ui-small` with `space.marker` at the sides.
- Icon-only buttons are square: as wide as they are tall.

## Consequences
- Changing variant or state never moves a button, since the outline sits inside it.
- Each variant sets custom properties and each state is one rule, so a state can never
  override disabled by being more specific.
- There is no danger variant. A destructive action would need a non-colour cue first.
