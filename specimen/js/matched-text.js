"use strict";

class MatchedText {
  constructor(text, query) {
    this.text = text;
    this.query = query;
  }

  nodes() {
    const start = this.matchStart();
    if (start < 0) return [this.text];
    const end = start + this.query.length;
    return [this.text.slice(0, start), this.mark(this.text.slice(start, end)), this.text.slice(end)];
  }

  matchStart() {
    if (this.query === "") return -1;
    return this.text.toLowerCase().indexOf(this.query.toLowerCase());
  }

  mark(text) {
    const match = document.createElement("mark");
    match.className = "list-match";
    match.textContent = text;
    return match;
  }
}
