# 0018. Status messages: notice, error and waiting

## Status
Accepted. Builds on 0006 and 0017.

## Context
Apps report what just happened in the status bar: a yank, a failed search, mail syncing.
The status bar had one plain message segment, with no error state and no limit on length.
The system is black and white, so an error cannot be red.

## Decision
- Messages sit in one `.status-bar-message` segment, after the command line and before the
  pending keys. A new message replaces the old one.
- A notice, such as `3 rows yanked`, is `component.status-bar.text`, the secondary text.
- An error is inverted: `color.focus` behind `color.text.inverse`. Vim draws `ErrorMsg` in
  standout, which is reverse video, on a monochrome terminal. The next message clears it.
- A waiting message, such as `Syncing mail…`, looks like a notice and ends with `…`. It does
  not animate, since only fades and moves animate (0008).
- A message too long for the bar ends with `…` instead of pushing the other segments out.
- An empty message takes no space.

## Consequences
- The mode block on the left and an error on the right are both inverted, so an error reads
  as loudly as the mode.
- In the specimen, a search with no matches shows `Pattern not found: <query>` as an error,
  as vim does.
