# 0012. Nest containers, controls and groups by one set of roles

## Status
Accepted. Refines 0008 and 0009.

## Context
The bar worked out a model for shapes inside shapes: an even inset inside the outline,
square inverted blocks, padding around each module's text, and more space between groups.
Those rules lived only in the bar's records, and other components used their own padding.
Apple's design language uses the same idea, which it calls concentricity: even margins
between a container and the shapes inside it, and an inner radius equal to the outer
radius minus the padding.

## Decision
- Four spacing roles:
  - `space.inset`, 4px: between a container's edge and its content, equal on all sides.
  - `space.control`, 7px: the left and right padding of a control. Controls may be wider
    than tall.
  - `space.marker`, 4px, an alias of `space.inset`: the left and right padding of a marker,
    and the space between markers side by side.
  - `space.cell`, 7px: between items in a group.
  - `space.group`, 14px: between groups. Space inside a group is always smaller.
- Inner radius = outer radius − inset, never below 0. `space.inset` equals
  `radius.container`, so inner shapes are square. A test fails if the inset becomes
  smaller than the radius, since inner shapes would then need a radius.
- Containers: the palette, which-key and the bar take `space.inset` on all four sides.
- Markers are inverted inline blocks: the active workspace, the low battery and the table
  cursor. A marker is the text with `space.marker` on each side, and at least as wide as
  its line is tall. One or two characters make a square; longer text is wider than tall.
- Markers side by side, such as workspaces, are `space.marker` apart. The strip around
  and between them is then 4px everywhere.
- Controls: buttons, inputs, list rows and the status line pad their text by `space.control`.
- Every `component.*.padding-inline` token points at `space.control`.

## Consequences
- The table cursor keeps its text in its column. Its `space.marker` sits outside the cell
  as a shadow, so the text does not move.
- GTK's `min-width` sets the content box, without padding. Waybar's workspace buttons take
  `bar.line` − 2 × `space.marker` as `min-width`, so with their padding they are 16px wide.
- The low battery keeps its module's footprint. In the critical state its padding drops to
  `space.marker` and a margin of `space.control` − `space.marker` makes up the rest, so
  only the text and 4px are inverted and nothing beside it moves.
- The rule covers our own chrome only. Hyprland cannot control what is inside apps.
- Optical adjustments stay allowed where the geometry looks wrong, as in 0010.
