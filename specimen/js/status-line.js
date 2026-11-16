"use strict";

class StatusLine {
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
