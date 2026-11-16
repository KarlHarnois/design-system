# 0007. Set small text in Iosevka Extended

## Status
Accepted

## Context
Small text is 12px. At that size, Iosevka's narrow 0.5em letters are hard to read.
Iosevka Extended has 0.6em letters and ships in the same `iosevka-bin` package.
ADR 0003 already lets 12px text break the 7px column where it does not sit in a grid column.

## Decision
- `type.ui-small` uses `font.family.mono-wide`, Iosevka Extended at 12px with a 21px line.
- Inside a line, letters are 7.2px wide and drift from the 7px cell.
- Each line still starts on the grid and sits on the baseline.

## Consequences
Small text never lines up character by character with body text, so tables and
columns that need that alignment use `type.ui`. The web build ships the Extended faces too.
