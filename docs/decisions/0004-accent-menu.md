# 0004. Offer a fixed accent menu through a resolver modifier

## Status
Superseded by [0006](0006-black-and-white.md)

## Context
People want to pick their own accent color. A free color pick can break contrast and
needs a shade generator. Radix Themes, GNOME and macOS instead offer a fixed list of
accents, each with shades tuned ahead of time.

## Decision
- Each accent is a file in `tokens/accent/` that points `accent.400` and `accent.500` at a primitive ramp.
- The resolver has an `accent` modifier with one context per file. The default is red.
- Themes alias `color.accent` and `color.focus` to the shade that suits them: 400 on dark, 500 on light.
- Mode colors stay fixed, so modes remain distinguishable whatever the accent.

## Consequences
Adding an accent means adding a primitive ramp, an accent file, and a resolver context.
Targets read the accent list from `tokens/resolver.json`, so none of them hardcode it.
On the web, `data-accent` on any element switches the accent below it.
