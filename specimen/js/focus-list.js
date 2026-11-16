"use strict";

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
