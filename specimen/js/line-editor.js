"use strict";

class LineEditor {
  static edits = {
    "<C-w>": (editor) => editor.deleteWordBefore(),
    "<C-u>": (editor) => editor.deleteToStart(),
    "<C-k>": (editor) => editor.deleteToEnd(),
    "<C-h>": (editor) => editor.deleteCharacterBefore(),
    "<C-a>": (editor) => editor.selectAll(),
    "<C-e>": (editor) => editor.moveTo(editor.input.value.length),
  };

  constructor(input) {
    this.input = input;
  }

  static handles(key) {
    return key in LineEditor.edits;
  }

  apply(key) {
    LineEditor.edits[key](this);
    this.input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  deleteWordBefore() {
    const before = this.textBeforeCursor();
    const wordStart = before.search(/\S*\s*$/);
    this.replaceBeforeCursor(before.slice(0, wordStart));
  }

  deleteToStart() {
    this.replaceBeforeCursor("");
  }

  deleteToEnd() {
    this.input.value = this.textBeforeCursor();
  }

  deleteCharacterBefore() {
    this.replaceBeforeCursor(this.textBeforeCursor().slice(0, -1));
  }

  selectAll() {
    this.input.select();
  }

  moveTo(position) {
    this.input.setSelectionRange(position, position);
  }

  textBeforeCursor() {
    return this.input.value.slice(0, this.input.selectionStart);
  }

  replaceBeforeCursor(text) {
    const after = this.input.value.slice(this.input.selectionEnd);
    this.input.value = text + after;
    this.moveTo(text.length);
  }
}
