"use strict";

class TokenGlossaryTable {
  constructor(entries) {
    this.entries = entries;
  }

  render(root) {
    const body = root.querySelector("[data-token-glossary]");
    body.replaceChildren(...this.entries.map((entry) => TokenGlossaryTable.row(entry)));
  }

  static row(entry) {
    const row = document.createElement("tr");
    row.className = "item";
    row.tabIndex = -1;
    row.dataset.name = `token ${entry.id.replaceAll(".", " ")} ${entry.type} ${entry.aliasOf ?? ""}`.toLowerCase();
    row.dataset.summary = TokenGlossaryTable.summary(entry);
    row.title = row.dataset.summary;
    row.append(TokenGlossaryTable.cell(entry.id), ...["dark", "light"].map((theme) => TokenGlossaryTable.valueCell(entry, theme)));
    return row;
  }

  static summary(entry) {
    const alias = entry.aliasOf ? ` → ${entry.aliasOf}` : "";
    const description = entry.description ? `. ${entry.description}` : "";
    return `${entry.cssVariable}${alias}${description}`;
  }

  static valueCell(entry, theme) {
    const cell = TokenGlossaryTable.cell(entry.values[theme]);
    if (entry.type === "color") cell.prepend(TokenGlossaryTable.chip(entry.values[theme]));
    return cell;
  }

  static chip(color) {
    const chip = document.createElement("span");
    chip.className = "glossary-chip";
    chip.style.setProperty("--chip", color);
    return chip;
  }

  static cell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }
}
