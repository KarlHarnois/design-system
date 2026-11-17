# 0019. Bold matches in filtered lists

## Status
Accepted. Builds on 0006 and 0017.

## Context
When a filter narrows a list, such as the palette or a label picker, the reader should see
why each row matched. The system is black and white, so the match cannot take a hue.

## Decision
- Matched characters are bold (`component.list.match-font-weight`), as Neovim draws
  `PmenuMatch` by default. Bold Iosevka is as wide as regular, so a match never moves the text.
- Bold alone read too subtle, so matches are also underlined with a 1px hairline,
  `focus.offset` below the text. We tried a gray fill, which vanished on selected rows, and a
  2px underline, which read heavier than needed. The underline shows on every row.
- Matches turn `color.text.primary`, so they also stand out inside secondary text such as a
  description.
- In a selected row the match keeps the row's inverted color and stays bold.
- The app marks matches with `<mark class="list-match">`.
- Search matches in an editor keep their outlines (0016). Bold is for filtered lists only.

## Consequences
- Filters match only the text a row shows, as fzf does, so every row that stays has a
  visible match.
