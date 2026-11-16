# 0009. Float the bar and set it in small text

## Status
Accepted. Builds on 0006, 0007 and 0008. Changed by 0011.

## Context
The bar ran full width along the top, in 14px text, with a centred clock and an
underlined workspace. It did not follow the desktop spacing in 0008, and its
modules changed width as their values changed.

## Decision
- Position: the bar floats. The frame (`space.frame`, 14px) sits on its top, left and
  right. One gutter (`space.cell`, 7px) sits between the bar and the windows.
- Outline: 1px in `color.border.default`, with the `radius.container` corner. The bar
  never takes keyboard focus, so it never gets the `color.focus` outline.
- Height: the text line is `bar.line`, 16px. An inset of `space.inset`, 4px, sits
  above and below it, and the 1px outline outside that, so the bar is 26px tall.
  The inset keeps inverted blocks clear of the outline and the rounded corners.
- The bar's content is inset by `space.cell` on the left and right.
- Spacing: each module and workspace has `space.inset` of padding left and right, which
  is the shape of every inverted block. Modules in a group are `space.cell` apart, groups
  `space.group` apart. The first and last text sit 7 + 4 = 11px from the outline.
- The line is 16px because GTK's Pango box for 12px Iosevka is 16px tall, not because of
  the grid. A shorter line would not shrink the GTK label, so the real bar would grow.
- The bar is desktop chrome, so `bar.line` is separate from the page's 21px line. The
  specimen status line stays on the page line, `space.line`.
- Layout: workspaces sit left. Volume, battery, date and time sit right, with the time
  last, in a status group (volume, battery) and a clock group (date, time).
  `bar/bar.json` holds the groups and modules (0011).
  There is no window title, and no submap since the desktop uses none (0011).
- One size: the whole bar is `type.ui-small`.
- Contrast: the current workspace is inverted, `color.text.inverse` on `color.focus`,
  at the full line height. The block is the digit plus 4px on each side. The time is `color.text.primary`.
  Everything else is `color.text.secondary`.
- Fixed width: a label and its value stay one space apart, as `vol 40%`. A minimum
  width with right alignment keeps each module the same width (0011). Muted volume is
  `vol ---`. Charging shows `chg` in place of `bat`.
- Date and time are two clock modules, `clock#date` and `clock#time`, so each gets
  its own colour. The date is `%a %d %b` and the time `%H:%M`.
- Low battery: below 10% and not charging, the battery is inverted. Waybar's
  `critical` state is set to 9, since its states match at or below the value. Its format
  zero-pads the value, as `bat 05%`, so the inverted block is the text plus 4px on each
  side, with no spare width.

## Consequences
- GTK3 CSS has no `line-height`. Labels and buttons take `bar.line` as `min-height`.
- 12px descenders end 1px to 2px above the bottom of the 16px line, so inverted blocks
  hold them without clipping.
- GTK3 CSS cannot change case, so the date keeps strftime's capitals, as `Mon 16 Nov`.
  Its width holds only in locales whose short day and month names have three letters.
- The build generates the Waybar config from `bar/bar.json` and the tokens.
- Waybar computes the height from the tokens: `bar.line` + 2 × `space.inset` +
  2 × `border.width.default`, 26px.
- Waybar's exclusive zone covers its top margin and height, so Hyprland's `gaps_out`
  top is one gutter.
- The specimen previews the bar in HTML. GTK can render it slightly differently.
