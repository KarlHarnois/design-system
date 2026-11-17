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
  `color.border.default`, `radius.container` corners and `space.inset` on all sides.
- Two surfaces:
  - `.container` sits on `color.surface.base`, for panels in a page.
  - `.container-raised` sits on `color.surface.raised`, for popups over the page.
- While focus is inside a container its outline turns `color.border.focused`, as the
  focused window's border does in Hyprland. So the desktop and the apps show focus the
  same way.
- `.container-title` is an optional first line in the label weight and
  `color.text.secondary`, padded by `space.control` so it lines up with list rows.
- Popups float `space.frame` from the screen edges and the status bar, as the desktop bar
  floats from the screen.
- The palette and which-key are raised containers.

## Consequences
- Tables stay content, not containers. A table that needs a frame goes inside a panel.
- A container adds its outline and inset twice to the height of its content, 10px. A
  container in a page restores the baseline with the space below it:
  `--container-chrome` holds the 10px so the margin can subtract it.
