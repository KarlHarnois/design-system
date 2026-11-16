"use strict";

class CommandPalette {
  constructor(element, commands, statusLine, onClose) {
    this.element = element;
    this.input = element.querySelector(".palette-input");
    this.list = element.querySelector(".palette-list");
    this.commands = commands;
    this.statusLine = statusLine;
    this.onClose = onClose;
    this.matches = [];
    this.selected = 0;
    this.input.addEventListener("input", () => this.filter());
  }

  isOpen() {
    return !this.element.hidden;
  }

  open() {
    this.element.hidden = false;
    this.input.value = "";
    this.filter();
    this.statusLine.enter("command");
    this.input.focus();
  }

  close() {
    this.element.hidden = true;
    this.onClose();
  }

  handleKey(key) {
    const actions = {
      "<Esc>": () => this.close(),
      "<CR>": () => this.runSelected(),
      "<C-n>": () => this.select(this.selected + 1),
      "<C-p>": () => this.select(this.selected - 1),
      ArrowDown: () => this.select(this.selected + 1),
      ArrowUp: () => this.select(this.selected - 1),
    };
    actions[key]?.();
    return key in actions;
  }

  runSelected() {
    const command = this.matches[this.selected];
    this.close();
    command?.run();
  }

  filter() {
    this.matches = this.commands.filter((command) => command.matches(this.input.value));
    this.select(0);
  }

  select(index) {
    this.selected = Math.min(Math.max(index, 0), Math.max(this.matches.length - 1, 0));
    this.list.replaceChildren(...this.matches.map((command, position) => this.row(command, position)));
  }

  row(command, position) {
    const item = document.createElement("li");
    item.className = "list-item palette-row";
    item.setAttribute("aria-selected", String(position === this.selected));
    const key = document.createElement("kbd");
    key.textContent = command.keys;
    item.append(`${command.name} `, key);
    return item;
  }
}
