"use strict";

class Specimen {
  constructor(root) {
    this.root = root;
    this.filterInput = root.querySelector(".filter input");
    const statusBar = root.querySelector(".mode-line");
    this.focusList = new FocusList([...root.querySelectorAll(".item")], statusBar);
    this.statusLine = new StatusLine(statusBar);
    this.tableCursor = new TableCursor(this.focusList);
    this.rowSelection = new RowSelection(this.focusList);
    this.whichKey = new WhichKey(root.querySelector(".which-key"));
    this.commands = this.normalCommands();
    this.palette = new CommandPalette(root.querySelector(".palette"), this.commands, this.statusLine, () =>
      this.enterNormal(),
    );
    this.keys = new KeySequence(this.commands, (pressed, continuations) => this.showPending(pressed, continuations));
  }

  start() {
    this.root.addEventListener("keydown", (event) => this.handleKey(event));
    this.filterInput.addEventListener("input", () => this.focusList.filter(this.filterInput.value));
    for (const button of this.root.querySelectorAll("button.button:not([aria-disabled='true'])")) {
      button.addEventListener("click", () => this.statusLine.showMessage(`${button.textContent} pressed`));
    }
    this.focusList.first();
  }

  normalCommands() {
    return [
      new Command("j", "down", "Next item", () => this.focusList.move(1)),
      new Command("k", "up", "Previous item", () => this.focusList.move(-1)),
      new Command("gg", "first", "First item", () => this.focusList.first()),
      new Command("G", "last", "Last item", () => this.focusList.last()),
      new Command("H", "screen-top", "Top item on screen", () => this.focusList.screenTop()),
      new Command("M", "screen-middle", "Middle item on screen", () => this.focusList.screenMiddle()),
      new Command("L", "screen-bottom", "Bottom item on screen", () => this.focusList.screenBottom()),
      new Command("h", "left", "Previous cell in the table row", () => this.tableCursor.move(-1)),
      new Command("l", "right", "Next cell in the table row", () => this.tableCursor.move(1)),
      new Command("0", "row-start", "First cell in the table row", () => this.tableCursor.first()),
      new Command("$", "row-end", "Last cell in the table row", () => this.tableCursor.last()),
      new Command("V", "visual-line", "Select table rows", () => this.enterVisual()),
      new Command("y", "yank", "Copy the selected rows", () => this.yank()),
      new Command("i", "insert", "Type in the focused field", () => this.enterInsert()),
      new Command("<CR>", "activate", "Press the focused button", () => this.activate()),
      new Command("/", "search", "Filter the tokens", () => this.enterSearch()),
      new Command(":", "command", "Open the command palette", () => this.palette.open()),
      new Command("<Esc>", "normal", "Leave visual mode or clear the filter", () => this.escape()),
      new Command("<Space>g", "toggle-baselines", "Show the baselines", () => this.toggleBaselines()),
      new Command("<Space>G", "toggle-full-grid", "Show the full grid", () => this.toggleFullGrid()),
      new Command("<Space>t", "toggle-theme", "Switch dark and light", () => this.toggleTheme()),
    ];
  }

  handleKey(event) {
    if (KeySequence.isModifierOnly(event) || event.metaKey || event.altKey) return;
    if (event.ctrlKey && !this.isTextEntryMode()) return;
    const key = KeySequence.notation(event);
    if (this.dispatch(key)) event.preventDefault();
  }

  dispatch(key) {
    if (this.isTextEntryMode() && LineEditor.handles(key)) return this.editLine(key);
    if (this.palette.isOpen()) return this.palette.handleKey(key);
    if (this.isTextEntryMode()) return this.handleTextEntryKey(key);
    return this.handleNormalKey(key);
  }

  editLine(key) {
    new LineEditor(document.activeElement).apply(key);
    return true;
  }

  handleNormalKey(key) {
    this.keys.press(key)?.run();
    this.tableCursor.render();
    this.rowSelection.render();
    return true;
  }

  handleTextEntryKey(key) {
    const leavesTextEntry = key === "<Esc>" || key === "<CR>";
    if (leavesTextEntry) this.enterNormal();
    return leavesTextEntry;
  }

  showPending(pressed, continuations) {
    this.statusLine.showPending(pressed);
    this.whichKey.update(pressed, continuations);
  }

  isTextEntryMode() {
    return document.activeElement instanceof HTMLInputElement;
  }

  enterInsert() {
    const input = this.focusList.current()?.querySelector(".input");
    if (!input) return;
    this.statusLine.enter("insert");
    input.focus();
  }

  activate() {
    const current = this.focusList.current();
    if (!current?.matches("button")) return;
    if (current.getAttribute("aria-disabled") === "true") {
      this.statusLine.showMessage(`${current.textContent} is disabled`);
      return;
    }
    this.showPressed(current);
    current.click();
  }

  showPressed(button) {
    const duration = parseFloat(getComputedStyle(this.root.documentElement).getPropertyValue("--duration-quick"));
    button.classList.add("is-pressed");
    setTimeout(() => button.classList.remove("is-pressed"), duration);
  }

  enterVisual() {
    this.rowSelection.start();
    if (this.rowSelection.isActive()) this.statusLine.enter("visual");
  }

  yank() {
    if (!this.rowSelection.isActive()) return;
    this.statusLine.showMessage(`${this.rowSelection.count()} rows yanked`);
    this.leaveVisual();
  }

  escape() {
    if (this.rowSelection.isActive()) this.leaveVisual();
    else this.clearFilter();
  }

  leaveVisual() {
    this.rowSelection.clear();
    this.statusLine.enter("normal");
  }

  enterSearch() {
    this.statusLine.enter("command");
    this.filterInput.focus();
  }

  enterNormal() {
    this.statusLine.enter("normal");
    this.focusList.focusCurrent();
  }

  clearFilter() {
    this.filterInput.value = "";
    this.focusList.filter("");
    this.focusList.focusCurrent();
  }

  toggleBaselines() {
    document.documentElement.classList.toggle("grid-overlay");
  }

  toggleFullGrid() {
    const classes = document.documentElement.classList;
    const showFullGrid = !classes.contains("grid-guides");
    classes.toggle("grid-overlay", showFullGrid);
    classes.toggle("grid-guides", showFullGrid);
  }

  toggleTheme() {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === "light" ? "dark" : "light";
  }
}

new BarPreview(window.BAR_SPEC).render(document);
new Specimen(document).start();
