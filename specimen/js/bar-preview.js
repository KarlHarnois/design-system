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
      this.side("modules-left", this.spec.left.map((group) => this.group(group))),
      this.side("modules-center", []),
      this.side("modules-right", this.spec.right.map((group) => this.group(group))),
    );
  }

  renderStates(element) {
    const samples = [...this.spec.left, ...this.spec.right].flatMap((group) => group.modules).flatMap((module) =>
      (module.stateSamples ?? []).map((sample) => this.stateModule(module, sample)),
    );
    element.replaceChildren(this.side("modules-right", [this.side("module-group", samples)]));
  }

  group(group) {
    const element = this.side("module-group", group.modules.map((module) => this.module(module, module.sample, [])));
    element.dataset.group = group.name;
    return element;
  }

  stateModule(module, sample) {
    const format = this.sampleFormat(module, sample);
    const classes = [sample.variant, sample.state].filter((name) => name !== undefined);
    return this.module({ ...module, format }, sample, classes);
  }

  sampleFormat(module, sample) {
    if (sample.variant !== undefined) return module.variants[sample.variant];
    return module.states?.[sample.state]?.format ?? module.format;
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
