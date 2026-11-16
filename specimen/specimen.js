"use strict";

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);

class FocusList {
  constructor(items, statusBar) {
    this.items = items;
    this.statusBar = statusBar;
    this.index = 0;
  }

  move(step) {
    const lastIndex = this.shownItems().length - 1;
    this.index = Math.min(Math.max(this.index + step, 0), lastIndex);
    this.focusCurrent();
  }

  first() {
    this.index = 0;
    this.focusCurrent();
    window.scrollTo({ top: 0 });
  }

  last() {
    this.index = this.shownItems().length - 1;
    this.focusCurrent();
    window.scrollTo({ top: document.documentElement.scrollHeight });
  }

  screenTop() {
    this.focusItem(this.onScreenItems().at(0));
  }

  screenMiddle() {
    const middle = this.statusBar.getBoundingClientRect().top / 2;
    const distanceToMiddle = (item) => Math.abs(FocusList.centerOf(item) - middle);
    const closest = this.onScreenItems().toSorted((one, other) => distanceToMiddle(one) - distanceToMiddle(other));
    this.focusItem(closest.at(0));
  }

  screenBottom() {
    this.focusItem(this.onScreenItems().at(-1));
  }

  filter(query) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    for (const item of this.items) {
      item.hidden = !words.every((word) => item.dataset.name.includes(word));
    }
    this.index = 0;
  }

  current() {
    return this.shownItems()[this.index];
  }

  focusCurrent() {
    const current = this.current();
    current?.focus();
    current?.scrollIntoView({ block: "nearest" });
  }

  focusItem(item) {
    if (!item) return;
    this.index = this.shownItems().indexOf(item);
    this.focusCurrent();
  }

  shownItems() {
    return this.items.filter((item) => !item.hidden);
  }

  onScreenItems() {
    const screenBottom = this.statusBar.getBoundingClientRect().top;
    return this.shownItems().filter((item) => {
      const { top, bottom } = item.getBoundingClientRect();
      return top >= 0 && bottom <= screenBottom;
    });
  }

  static centerOf(item) {
    const { top, bottom } = item.getBoundingClientRect();
    return (top + bottom) / 2;
  }
}

class ModeLine {
  constructor(element) {
    this.element = element;
    this.modeName = element.querySelector(".status-bar-mode");
    this.message = element.querySelector(".message");
    this.pendingKeys = element.querySelector(".pending-keys");
  }

  enter(mode) {
    document.documentElement.dataset.mode = mode;
    this.modeName.textContent = mode;
  }

  showMessage(text) {
    this.message.textContent = text;
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
    this.filterInput = root.querySelector(".filter input");
    this.accents = [...root.querySelectorAll(".accent-option")].map((option) => option.dataset.accent);
    const statusBar = root.querySelector(".mode-line");
    this.focusList = new FocusList([...root.querySelectorAll(".item")], statusBar);
    this.modeLine = new ModeLine(statusBar);
    this.keys = new KeySequence(this.normalBindings(), this.modeLine);
  }

  start() {
    this.root.addEventListener("keydown", (event) => this.handleKey(event));
    this.filterInput.addEventListener("input", () => this.focusList.filter(this.filterInput.value));
    for (const button of this.root.querySelectorAll(".button")) {
      button.addEventListener("click", () => this.modeLine.showMessage(`${button.textContent} pressed`));
    }
    this.focusList.first();
  }

  normalBindings() {
    return {
      j: () => this.focusList.move(1),
      k: () => this.focusList.move(-1),
      gg: () => this.focusList.first(),
      G: () => this.focusList.last(),
      H: () => this.focusList.screenTop(),
      M: () => this.focusList.screenMiddle(),
      L: () => this.focusList.screenBottom(),
      i: () => this.enterInsert(),
      "<CR>": () => this.activate(),
      "/": () => this.enterCommand(),
      "<Esc>": () => this.clearFilter(),
      "<Space>g": () => document.documentElement.classList.toggle("grid-overlay"),
      "<Space>G": () => this.toggleFullGrid(),
      "<Space>t": () => this.toggleTheme(),
      "<Space>a": () => this.cycleAccent(),
    };
  }

  handleKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || MODIFIER_KEYS.has(event.key)) return;
    const handled = this.isTextEntryMode() ? this.handleTextEntryKey(event) : this.handleNormalKey(event);
    if (handled) event.preventDefault();
  }

  handleNormalKey(event) {
    const action = this.keys.press(KeySequence.notation(event));
    action?.();
    return true;
  }

  handleTextEntryKey(event) {
    const leavesTextEntry = ["Escape", "Enter"].includes(event.key);
    if (leavesTextEntry) this.enterNormal();
    return leavesTextEntry;
  }

  isTextEntryMode() {
    return document.activeElement instanceof HTMLInputElement;
  }

  enterInsert() {
    const input = this.focusList.current()?.querySelector(".input");
    if (!input) return;
    this.modeLine.enter("insert");
    input.focus();
  }

  activate() {
    const current = this.focusList.current();
    if (current?.matches("button")) current.click();
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

  toggleFullGrid() {
    const classes = document.documentElement.classList;
    const showFullGrid = !classes.contains("grid-guides");
    classes.toggle("grid-overlay", showFullGrid);
    classes.toggle("grid-guides", showFullGrid);
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
