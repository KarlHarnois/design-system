# 0015. One container for panels and popups

## Status
Accepted. Builds on 0008, 0009 and 0012.

## Context
0012 names windows, the bar and popups as containers with a 4px corner and a 4px inset.
Windows and the bar had both. The palette and which-key had the inset only: no outline,
no corner, and they sat flush against the screen edge and the status bar. Pages had no
way to group components in a box.

## Decision
- `.container` is the one box. It has a `border.width.default` outline in
  `color.border.default` and `radius.container` corners. Insets include the outline.
- Two insets:
  - Text containers, the default, hold bare text such as list rows and a title.
    - Top and bottom: `space.half-line`, 10.5px. Together they add one line, so the box
      is always a whole number of lines tall and stays on the baseline grid.
    - Left and right: `space.text-inset`, 16px. That is the half line plus half the gap
      between the line and the cap height, so text sits as far from the side as the caps
      sit from the top. Exactly 15.84px, rounded.
    - What is left over is Iosevka's line box, which has 0.7px more above the caps than
      below the baseline. The offsets from 0010 can absorb it; they stay at 0px.
  - `.container-tight` uses `space.inset`, 4px, on all sides, for widgets whose items are
    markers with their own padding, as in the bar.
- Inside a text container, list rows have no side padding, so their text lines up with the
  title. A selected row adds `space.control` on the left, so its text moves right past the
  marker.
- Two surfaces:
  - `.container` sits on `color.surface.base`, for panels in a page.
  - `.container-raised` sits on `color.surface.raised`, for popups over the page.
- While focus is inside a container its outline turns `color.border.focused`, as the
  focused window's border does in Hyprland. So the desktop and the apps show focus the
  same way.
- `.container-title` is an optional first line, `component.container.title-height` tall,
  in the label weight and `color.text.secondary`.
- The box edges sit on the column grid. Popups float `space.frame` from the screen edges
  and the status bar, as the desktop bar floats from the screen.
- The palette and which-key are raised text containers.

## Consequences
- Tables stay content, not containers. A table that needs a frame goes inside a panel.
- A selected row's text moves, unlike the marker rule in 0012, where only colours change.
- `space.text-inset` depends on the cap height of `type.ui`. Changing the font or its size
  means recomputing it.
