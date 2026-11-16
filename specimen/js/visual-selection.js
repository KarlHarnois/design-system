"use strict";

class VisualSelection {
  static motions = {
    h: (selection) => selection.moveHead(selection.head - 1),
    l: (selection) => selection.moveHead(selection.head + 1),
    0: (selection) => selection.moveHead(0),
    $: (selection) => selection.moveHead(selection.lastIndex()),
    w: (selection) => selection.moveHead(selection.search(/\s\S/g, selection.head) + 1),
    b: (selection) => selection.moveHead(selection.lastMatchBefore(/(^|\s)\S/g)),
    e: (selection) => selection.moveHead(selection.search(/\S(\s|$)/g, selection.head + 1)),
  };

  constructor(input, linewise) {
    this.input = input;
    this.linewise = linewise;
    this.anchor = linewise ? 0 : this.caret();
    this.head = linewise ? this.lastIndex() : this.anchor;
    this.render();
  }

  static isMotion(key) {
    return key in VisualSelection.motions;
  }

  move(key) {
    if (this.linewise) return;
    VisualSelection.motions[key](this);
    this.render();
  }

  text() {
    return this.input.value.slice(this.start(), this.end());
  }

  delete() {
    const { value } = this.input;
    const start = this.start();
    this.input.value = value.slice(0, start) + value.slice(this.end());
    this.input.setSelectionRange(start, start);
    this.input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  moveHead(position) {
    this.head = Math.min(Math.max(position, 0), this.lastIndex());
  }

  search(pattern, from) {
    pattern.lastIndex = from;
    const match = pattern.exec(this.input.value);
    return match ? match.index : this.lastIndex();
  }

  lastMatchBefore(pattern) {
    const starts = [...this.input.value.slice(0, this.head).matchAll(pattern)].map((match) => match.index + match[1].length);
    return starts.at(-1) ?? 0;
  }

  lastIndex() {
    return Math.max(this.input.value.length - 1, 0);
  }

  caret() {
    return Math.min(this.input.selectionStart ?? 0, this.lastIndex());
  }

  start() {
    return Math.min(this.anchor, this.head);
  }

  end() {
    return Math.max(this.anchor, this.head) + 1;
  }

  render() {
    this.input.setSelectionRange(this.start(), this.end());
  }
}
