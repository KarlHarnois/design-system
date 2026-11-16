"use strict";

class BarPreview {
  constructor(spec) {
    this.spec = spec;
  }

  render(root) {
    this.renderBar(root.querySelector('[data-bar-preview="bar"]'));
    this.renderStates(root.querySelector('[data-bar-preview="states"]'));
  }

  renderBar(element) {
    element.replaceChildren(
      this.side("modules-left", this.spec.left.map((module) => this.module(module, module.sample, []))),
      this.side("modules-center", []),
      this.side("modules-right", this.spec.right.map((module) => this.module(module, module.sample, []))),
    );
  }

  renderStates(element) {
    const samples = [...this.spec.left, ...this.spec.right].flatMap((module) =>
      (module.stateSamples ?? []).map((sample) => this.stateModule(module, sample)),
    );
    element.replaceChildren(this.side("modules-right", samples));
  }

  stateModule(module, sample) {
    const format = sample.variant === undefined ? module.format : module.variants[sample.variant];
    const classes = [sample.variant, sample.state].filter((name) => name !== undefined);
    return this.module({ ...module, format }, sample, classes);
  }

  module(module, sample, classes) {
    if (sample.items !== undefined) return this.workspaces(module, sample);
    const element = document.createElement("span");
    element.classList.add(module.name, ...classes);
    element.textContent = new WaybarFormat(module.format).render(sample);
    if (module.width !== undefined) {
      element.classList.add("module-fixed", `module-align-${module.align ?? "left"}`);
      element.style.setProperty("--module-width", module.width);
    }
    return element;
  }

  workspaces(module, sample) {
    const element = document.createElement("span");
    element.classList.add(module.name);
    for (const item of sample.items) {
      const workspace = document.createElement("span");
      workspace.classList.add("workspace");
      workspace.classList.toggle("active", item === sample.active);
      workspace.textContent = new WaybarFormat(module.format).render({ values: { name: item } });
      element.append(workspace);
    }
    return element;
  }

  side(className, children) {
    const element = document.createElement("div");
    element.classList.add(className);
    element.append(...children);
    return element;
  }
}
