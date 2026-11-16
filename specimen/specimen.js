"use strict";

class FocusList {
  constructor(items) {
    this.items = items;
    this.index = 0;
  }

  move(step) {
    const visible = this.visibleItems();
    const lastIndex = visible.length - 1;
    this.index = Math.min(Math.max(this.index + step, 0), lastIndex);
    this.focusCurrent();
  }

  first() {
    this.index = 0;
    this.focusCurrent();
  }

  last() {
    this.index = this.visibleItems().length - 1;
    this.focusCurrent();
  }

  filter(query) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    for (const item of this.items) {
      item.hidden = !words.every((word) => item.dataset.name.includes(word));
    }
    this.index = 0;
  }

  focusCurrent() {
    const current = this.visibleItems()[this.index];
    current?.focus();
    current?.scrollIntoView({ block: "nearest" });
  }

  visibleItems() {
    return this.items.filter((item) => !item.hidden);
  }
}

class ModeLine {
  constructor(element) {
    this.element = element;
    this.modeName = element.querySelector(".mode-name");
    this.pendingKeys = element.querySelector(".pending-keys");
  }

  enter(mode) {
    this.element.dataset.mode = mode;
    this.modeName.textContent = mode.toUpperCase();
  }

  showPending(keys) {
    this.pendingKeys.textContent = keys;
  }
}

class KeySequence {
  constructor(bindings, modeLine) {
    this.bindings = bindings;
    this.modeLine = modeLine;
    this.pressed = "";
  }

  static notation(event) {
    const namedKeys = { " ": "<Space>", Escape: "<Esc>", Enter: "<CR>" };
    return namedKeys[event.key] ?? event.key;
  }

  press(key) {
    this.pressed += key;
    const action = this.bindings[this.pressed];
    if (action || !this.isPrefix()) {
      this.reset();
    }
    this.modeLine.showPending(this.pressed);
    return action;
  }

  reset() {
    this.pressed = "";
  }

  isPrefix() {
    return Object.keys(this.bindings).some((sequence) => sequence.startsWith(this.pressed));
  }
}

class Specimen {
  constructor(root) {
    this.root = root;
    this.grid = root.querySelector(".grid");
    this.filterInput = root.querySelector(".filter input");
    this.accents = [...root.querySelectorAll(".accent-option")].map((option) => option.dataset.accent);
    this.focusList = new FocusList([...root.querySelectorAll(".item")]);
    this.modeLine = new ModeLine(root.querySelector(".mode-line"));
    this.keys = new KeySequence(this.normalBindings(), this.modeLine);
  }

  start() {
    this.root.addEventListener("keydown", (event) => this.handleKey(event));
    this.filterInput.addEventListener("input", () => this.focusList.filter(this.filterInput.value));
    this.focusList.first();
  }

  normalBindings() {
    return {
      j: () => this.focusList.move(1),
      k: () => this.focusList.move(-1),
      gg: () => this.focusList.first(),
      G: () => this.focusList.last(),
      "/": () => this.enterCommand(),
      "<Esc>": () => this.clearFilter(),
      "<Space>g": () => this.grid.classList.toggle("show-grid"),
      "<Space>t": () => this.toggleTheme(),
      "<Space>a": () => this.cycleAccent(),
    };
  }

  handleKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const handled = this.isCommandMode() ? this.handleCommandKey(event) : this.handleNormalKey(event);
    if (handled) event.preventDefault();
  }

  handleNormalKey(event) {
    const action = this.keys.press(KeySequence.notation(event));
    action?.();
    return true;
  }

  handleCommandKey(event) {
    const leavesCommandMode = ["Escape", "Enter"].includes(event.key);
    if (leavesCommandMode) this.enterNormal();
    return leavesCommandMode;
  }

  isCommandMode() {
    return document.activeElement === this.filterInput;
  }

  enterCommand() {
    this.modeLine.enter("command");
    this.filterInput.focus();
  }

  enterNormal() {
    this.modeLine.enter("normal");
    this.focusList.focusCurrent();
  }

  clearFilter() {
    this.filterInput.value = "";
    this.focusList.filter("");
    this.focusList.focusCurrent();
  }

  cycleAccent() {
    const html = document.documentElement;
    const nextIndex = (this.accents.indexOf(html.dataset.accent) + 1) % this.accents.length;
    html.dataset.accent = this.accents[nextIndex];
  }

  toggleTheme() {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === "light" ? "dark" : "light";
  }
}

new Specimen(document).start();
