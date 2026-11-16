# 0005. Generate the web grid with knave-grid

## Status
Accepted. Refines 0003.

## Context
Spacing in multiples of 8px did not keep text on the baseline grid. Placing baselines
needs the font's metrics, rounding that matches browsers, and whole-line spacing.
knave-grid already does this and checks the spec.

## Decision
- A Terrazzo plugin writes a `defgrid` spec to `grid/src/design-grid.knv` from the typography and `grid.type-area.*` tokens.
- `knave task build-grid` in `grid/` turns the spec into `dist/grid/grid.css`, its fonts, and the overlay CSS.
- Every type style's line height is a whole number of lines. One-line styles sit on their own line, and taller styles hang.
- Web fonts are subsets of the nixpkgs Iosevka build, so web and desktop use the same version.

## Consequences
The web build needs Knave, which the dev shell provides. The Nix package builds only the
Terrazzo outputs, because Knave fetches crates over the network.
