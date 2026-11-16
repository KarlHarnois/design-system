# 0009. Float the bar and set it in small text

## Status
Accepted. Builds on 0006, 0007 and 0008.

## Context
The bar ran full width along the top, in 14px text, with a centred clock and an
underlined workspace. It did not follow the desktop spacing in 0008, and its
modules changed width as their values changed.

## Decision
- Position: the bar floats. The frame (`space.frame`, 14px) sits on its top, left and
  right. One gutter (`space.cell`, 7px) sits between the bar and the windows.
- Outline: 1px in `color.border.default`, with the `radius.container` corner. The bar
  never takes keyboard focus, so it never gets the `color.focus` outline.
- Height: the text line is `bar.height`, 21px. An inset of `space.inset`, 4px, sits
  around it on all four sides, and the 1px outline outside that, so the bar is 31px tall.
  The inset keeps inverted blocks clear of the outline and the rounded corners.
- Layout: workspaces and the submap sit left. The focused window's title fills the
  middle and truncates with an ellipsis. Volume, battery, date and time sit right,
  with the time last. Each module has one cell of padding, and the groups are two
  cells apart.
- One size: the whole bar is `type.ui-small`.
- Contrast: the current workspace and the submap are inverted, `color.text.inverse`
  on `color.focus`, at the full line height. The time is `color.text.primary`.
  Everything else is `color.text.secondary`.
- Fixed width: percentages pad to three characters, as `vol  40%` and `bat   5%`.
  Muted volume is `vol  ---`. Charging shows `chg` in place of `bat`.
- Date and time are two clock modules, `clock#date` and `clock#time`, so each gets
  its own colour. The date is `%a %d %b` and the time `%H:%M`.
- Low battery: below 10% and not charging, the battery is inverted. Waybar's
  `critical` state is set to 9, since its states match at or below the value.

## Consequences
- Waybar formats with fmt, so `{volume:>3}` and `{capacity:>3}` pad in place.
- GTK3 CSS has no `line-height`. Labels and buttons take the 21px line as `min-height`.
- GTK3 CSS cannot change case, so the date keeps strftime's capitals, as `Mon 16 Nov`.
  Its width holds only in locales whose short day and month names have three letters.
- Waybar computes the height from the tokens: `bar.height` + 2 × `space.inset` +
  2 × `border.width.default`.
- Waybar's exclusive zone covers its top margin and height, so Hyprland's `gaps_out`
  top is one gutter.
- The specimen previews the bar in HTML. GTK can render it slightly differently.
