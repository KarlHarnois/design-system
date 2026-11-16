"use strict";

class WhichKey {
  constructor(element) {
    this.element = element;
    this.list = element.querySelector(".which-key-list");
    this.timer = undefined;
    this.delayMs = parseFloat(getComputedStyle(element).getPropertyValue("--component-which-key-delay"));
  }

  update(pressed, continuations) {
    clearTimeout(this.timer);
    this.hide();
    if (continuations.length === 0) return;
    this.timer = setTimeout(() => this.show(pressed, continuations), this.delayMs);
  }

  show(pressed, continuations) {
    this.list.replaceChildren(...continuations.map((command) => WhichKey.entry(pressed, command)));
    this.element.hidden = false;
  }

  hide() {
    this.element.hidden = true;
  }

  static entry(pressed, command) {
    const item = document.createElement("li");
    const key = document.createElement("kbd");
    key.textContent = command.keys.slice(pressed.length);
    item.append(key, ` ${command.description}`);
    return item;
  }
}
