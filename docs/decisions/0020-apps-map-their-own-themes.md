# 0020. Apps map the tokens to their own themes

## Status
Accepted. Builds on 0001.

## Context
The build writes files for tools that cannot read tokens: Waybar, Hyprland and base16. Our
own apps, such as knave-mail, have their own theme formats too. A build target for each app
would tie the design system to every app's keys, so an app change would need a design system
change.

## Decision
- The design system publishes generic outputs only: `css/tokens.css`, the components, and
  `glossary/glossary.json` with each token's value per theme.
- Build targets stay for third-party tools whose format we do not control.
- Each of our apps maps the tokens to its own theme in its own repository, for example
  knave-mail building its `theme.knv` from the glossary.
- `color.surface.document` is the canvas behind documents written for white paper, such as
  HTML mail. It is white in both themes, since most HTML mail assumes it.

## Consequences
- An app can change its theme keys without touching the design system.
- An app reads the design system's outputs, so renaming a semantic token breaks the app's
  mapping. The glossary lists every token, so the app can test its mapping against it.
