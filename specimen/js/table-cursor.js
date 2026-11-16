"use strict";

class TableCursor {
  constructor(focusList) {
    this.focusList = focusList;
    this.column = 0;
  }

  move(step) {
    this.moveTo(this.column + step);
  }

  first() {
    this.moveTo(0);
  }

  last() {
    this.moveTo(Number.MAX_SAFE_INTEGER);
  }

  render() {
    const row = this.currentRow();
    for (const cell of document.querySelectorAll(".table-cell-active")) cell.classList.remove("table-cell-active");
    row?.cells[this.column]?.classList.add("table-cell-active");
  }

  moveTo(column) {
    const row = this.currentRow();
    if (!row) return;
    this.column = Math.min(Math.max(column, 0), row.cells.length - 1);
    this.render();
  }

  currentRow() {
    const current = this.focusList.current();
    return current instanceof HTMLTableRowElement ? current : undefined;
  }
}
