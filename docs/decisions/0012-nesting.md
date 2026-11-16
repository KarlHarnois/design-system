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
  - `space.control`, 7px: the left and right padding of a control or marker. Controls
    and markers may be wider than tall.
  - `space.cell`, 7px: between items in a group.
  - `space.group`, 14px: between groups. Space inside a group is always smaller.
- Inner radius = outer radius − inset, never below 0. `space.inset` equals
  `radius.container`, so inner shapes are square. A test fails if the inset becomes
  smaller than the radius, since inner shapes would then need a radius.
- Containers: the palette, which-key and the bar take `space.inset` on all four sides.
- Markers: the active workspace, the low battery, the list selection and the table cursor
  are one shape, the text with `space.control` on each side.
- Controls: buttons, inputs and the status line pad their text by `space.control`.
- Every `component.*.padding-inline` token points at `space.control`.

## Consequences
- The table cursor keeps its text in its column. Its `space.control` sits outside the
  cell as a shadow, so the text does not move.
- The rule covers our own chrome only. Hyprland cannot control what is inside apps.
- Optical adjustments stay allowed where the geometry looks wrong, as in 0010.
