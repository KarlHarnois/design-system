"use strict";

class RowSelection {
  constructor(focusList) {
    this.focusList = focusList;
    this.anchor = undefined;
  }

  start() {
    const current = this.focusList.current();
    if (current instanceof HTMLTableRowElement) this.anchor = current;
  }

  clear() {
    this.anchor = undefined;
    this.render();
  }

  isActive() {
    return this.anchor !== undefined;
  }

  count() {
    return this.selectedRows().length;
  }

  render() {
    for (const row of document.querySelectorAll("tr.is-selected")) row.classList.remove("is-selected");
    for (const row of this.selectedRows()) row.classList.add("is-selected");
  }

  selectedRows() {
    if (!this.anchor) return [];
    const rows = [...this.anchor.parentElement.rows].filter((row) => !row.hidden);
    const anchorIndex = rows.indexOf(this.anchor);
    const cursorIndex = this.cursorIndexIn(rows);
    return rows.slice(Math.min(anchorIndex, cursorIndex), Math.max(anchorIndex, cursorIndex) + 1);
  }

  cursorIndexIn(rows) {
    const cursor = this.focusList.current();
    if (rows.includes(cursor)) return rows.indexOf(cursor);
    return this.anchor.compareDocumentPosition(cursor) & Node.DOCUMENT_POSITION_FOLLOWING ? rows.length - 1 : 0;
  }
}
