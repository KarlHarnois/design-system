# 0002. Keep keybindings in a separate keymap spec

## Status
Accepted

## Context
DTCG describes visual values. Keybindings are behavior, and DTCG has no type for them.
Storing them under `$extensions` would hide them from schema validation.

## Decision
Keep bindings in `keymap/keymap.json`, validated by `keymap/keymap.schema.json`.
Visual parts of the keyboard model, like focus rings and mode colors, stay in DTCG.

## Consequences
Targets consume two inputs: the built tokens and the keymap. Both live in this repo
and are versioned together.
