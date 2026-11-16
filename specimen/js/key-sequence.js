"use strict";

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta", "CapsLock"]);
const NAMED_KEYS = { " ": "<Space>", Escape: "<Esc>", Enter: "<CR>", Backspace: "<BS>", Tab: "<Tab>" };

class KeySequence {
  constructor(commands, onPending) {
    this.commands = commands;
    this.onPending = onPending;
    this.pressed = "";
  }

  static notation(event) {
    const key = NAMED_KEYS[event.key] ?? event.key;
    return event.ctrlKey ? `<C-${key.toLowerCase()}>` : key;
  }

  static isModifierOnly(event) {
    return MODIFIER_KEYS.has(event.key);
  }

  press(key) {
    this.pressed += key;
    const command = this.commands.find((candidate) => candidate.keys === this.pressed);
    if (command || this.continuations().length === 0) this.reset();
    this.onPending(this.pressed, this.continuations());
    return command;
  }

  reset() {
    this.pressed = "";
  }

  continuations() {
    if (this.pressed === "") return [];
    return this.commands.filter((command) => command.keys.startsWith(this.pressed) && command.keys !== this.pressed);
  }
}
