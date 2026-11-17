"use strict";

class CommandPalette {
  constructor(element, commands, statusLine, onClose) {
    this.element = element;
    this.input = element.querySelector(".palette-input");
    this.list = element.querySelector(".palette-list");
    this.count = element.querySelector(".command-line-count");
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

  handles(key) {
    return key in this.actions();
  }

  handleKey(key) {
    this.actions()[key]?.();
    return this.handles(key);
  }

  actions() {
    const next = () => this.select(this.selected + 1);
    const previous = () => this.select(this.selected - 1);
    return {
      "<Esc>": () => this.close(),
      "<CR>": () => this.runSelected(),
      "<C-n>": next,
      "<C-p>": previous,
      "<C-j>": next,
      "<C-k>": previous,
      ArrowDown: next,
      ArrowUp: previous,
    };
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
    this.list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    this.count.textContent = this.countText();
  }

  countText() {
    const position = this.matches.length === 0 ? 0 : this.selected + 1;
    return `${position}/${this.matches.length}`;
  }

  row(command, position) {
    const item = document.createElement("li");
    item.className = "list-item palette-row";
    item.setAttribute("aria-selected", String(position === this.selected));
    const key = document.createElement("kbd");
    key.textContent = command.keys;
    const name = document.createElement("span");
    name.append(...new MatchedText(command.name, this.input.value).nodes());
    item.append(name, key);
    return item;
  }
}
